insert into subjects (slug, name, name_bn, group_key, display_order) values
  ('english',   'English 2nd Paper',   'Grammar & Composition', 'general', 1),
  ('ict',       'ICT',                 'Information & Communication Technology', 'general', 2),
  ('gmath',     'General Mathematics', 'সাধারণ গণিত', 'general', 3),
  ('physics',   'Physics',             'পদার্থবিজ্ঞান', 'science', 4),
  ('chemistry', 'Chemistry',           'রসায়ন', 'science', 5),
  ('hmath',     'Higher Mathematics',  'উচ্চতর গণিত', 'science', 6),
  ('biology',   'Biology',             'জীববিজ্ঞান', 'science', 7)
on conflict (slug) do nothing;
