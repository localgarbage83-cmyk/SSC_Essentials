export const CATEGORIES = [
  { key: 'notes', label: 'Notes' },
  { key: 'mcq', label: 'MCQ + Detailed Explanation' },
  { key: 'cq', label: 'CQ + Complete Solutions' },
  { key: 'extra', label: 'Extra Topics' },
  { key: 'model', label: 'Model Questions' },
  { key: 'other', label: 'Other Materials' }
];
export const categoryLabel = k => CATEGORIES.find(c => c.key === k)?.label || k;
export const PREVIEW_PAGES = 5;
