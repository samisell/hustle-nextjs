'use client';

import { motion } from 'framer-motion';

interface PageWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function PageWrapper({ title, description, children }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </motion.div>
  );
}
