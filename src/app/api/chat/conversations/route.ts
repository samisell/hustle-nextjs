import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/chat/conversations - List user's conversations
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await db.conversationMember.findMany({
      where: { userId: payload.userId },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true },
                },
              },
            },
            _count: {
              select: { messages: true },
            },
          },
        },
      },
      orderBy: { conversation: { lastMessageAt: 'desc' } },
    });

    const conversations = [];

    for (const membership of memberships) {
      const conv = membership.conversation;
      const otherMembers = conv.members.filter((m) => m.userId !== payload.userId);

      // Get last message
      const lastMessage = await db.chatMessage.findFirst({
        where: { conversationId: conv.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, content: true, createdAt: true, userId: true },
      });

      // Get unread count
      const unreadCount = await db.chatMessage.count({
        where: {
          conversationId: conv.id,
          isRead: false,
          userId: { not: payload.userId },
        },
      });

      conversations.push({
        id: conv.id,
        name: conv.name,
        isGroup: conv.isGroup,
        lastMessageAt: conv.lastMessageAt?.toISOString() || null,
        members: conv.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          avatar: m.user.avatar,
          joinedAt: m.joinedAt.toISOString(),
        })),
        otherMembers: otherMembers.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          avatar: m.user.avatar,
        })),
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          createdAt: lastMessage.createdAt.toISOString(),
          userId: lastMessage.userId,
        } : null,
        unreadCount,
      });
    }

    // Sort by lastMessageAt desc
    conversations.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    return NextResponse.json({ conversations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Chat Conversations List Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/chat/conversations - Create conversation
export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { participantIds, name } = body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: 'participantIds is required and must be a non-empty array.' }, { status: 400 });
    }

    // For DM (1 participant), check if conversation already exists
    if (participantIds.length === 1) {
      const otherUserId = participantIds[0];
      if (otherUserId === payload.userId) {
        return NextResponse.json({ error: 'Cannot create a conversation with yourself.' }, { status: 400 });
      }

      // Check if user exists
      const otherUser = await db.user.findUnique({
        where: { id: otherUserId },
        select: { id: true },
      });
      if (!otherUser) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }

      // Check if DM already exists
      const existingMemberships = await db.conversationMember.findMany({
        where: { userId: payload.userId },
        select: { conversationId: true },
      });
      const existingConvIds = existingMemberships.map((m) => m.conversationId);

      for (const convId of existingConvIds) {
        const members = await db.conversationMember.findMany({
          where: { conversationId: convId },
          include: {
            conversation: {
              select: { isGroup: true },
            },
          },
        });
        const memberIds = members.map((m) => m.userId);
        if (!members[0].conversation.isGroup && memberIds.includes(otherUserId)) {
          // Return existing conversation
          const conversation = await db.conversation.findUnique({
            where: { id: convId },
            include: {
              members: {
                include: {
                  user: { select: { id: true, name: true, avatar: true } },
                },
              },
            },
          });
          return NextResponse.json({ conversation, existing: true });
        }
      }

      // Create new DM
      const conversation = await db.conversation.create({
        data: {
          isGroup: false,
          lastMessageAt: new Date(),
          members: {
            create: [
              { userId: payload.userId },
              { userId: otherUserId },
            ],
          },
        },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
      });

      return NextResponse.json({ conversation }, { status: 201 });
    }

    // Group chat (2+ participants)
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required for group conversations.' }, { status: 400 });
    }

    // Validate all participants exist
    const users = await db.user.findMany({
      where: { id: { in: participantIds } },
      select: { id: true },
    });
    const foundIds = users.map((u) => u.id);
    const missingIds = participantIds.filter((id: string) => !foundIds.includes(id));
    if (missingIds.length > 0) {
      return NextResponse.json({ error: 'One or more users not found.' }, { status: 404 });
    }

    const allMemberIds = [...new Set([payload.userId, ...participantIds])];
    const conversation = await db.conversation.create({
      data: {
        name: name.trim(),
        isGroup: true,
        lastMessageAt: new Date(),
        members: {
          create: allMemberIds.map((userId: string) => ({ userId })),
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Chat Conversation Create Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
