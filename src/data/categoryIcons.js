import {
  Briefcase,
  GraduationCap,
  FolderGit2,
  Home,
  ShoppingCart,
  Dumbbell,
  Users,
  Gamepad2,
  Coffee,
  Layers
} from 'lucide-react';

export const CATEGORY_ICONS = {
  'work / professional': Briefcase,
  'school / studies': GraduationCap,
  project: FolderGit2,
  responsibilities: Home,
  errands: ShoppingCart,
  'training / exercise': Dumbbell,
  'hangouts / social activities': Users,
  'games / gaming': Gamepad2,
  'rest / personal time': Coffee,
  'other activities': Layers
};

export const CATEGORY_COLORS = {
  'work / professional': 'var(--accent-purple, #a855f7)',
  project: 'var(--warning)',
  'training / exercise': 'var(--success)',
  'rest / personal time': 'var(--info)'
};
