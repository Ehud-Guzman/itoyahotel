export const galleryImage = {
  name:  'galleryImage',
  title: 'Gallery Image',
  type:  'document',
  fields: [
    {
      name:    'image',
      title:   'Image',
      type:    'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required().error('Please upload an image.'),
    },
    {
      name:        'alt',
      title:       'Caption / Alt Text',
      type:        'string',
      description: 'Describe what is shown (e.g. "Hotel Lobby", "Deluxe Room View").',
      validation:  (Rule) => Rule.required().error('Caption is required for accessibility.'),
    },
    {
      name:    'category',
      title:   'Category',
      type:    'string',
      options: {
        list: [
          { title: 'Hotel Spaces',  value: 'spaces' },
          { title: 'Rooms',        value: 'rooms' },
          { title: 'Dining',       value: 'dining' },
          { title: 'Conference',   value: 'conference' },
          { title: 'Events',       value: 'events' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required().error('Please select a category.'),
    },
    {
      name:        'order',
      title:       'Display Order',
      type:        'number',
      description: 'Lower number appears first. Leave blank to add at the end.',
      initialValue: 99,
    },
  ],
  preview: {
    select: {
      title:    'alt',
      subtitle: 'category',
      media:    'image',
    },
    prepare({ title, subtitle, media }) {
      const labels = {
        spaces: 'Hotel Spaces', rooms: 'Rooms',
        dining: 'Dining', conference: 'Conference', events: 'Events',
      }
      return { title, subtitle: labels[subtitle] || subtitle, media }
    },
  },
  orderings: [
    {
      title: 'Display Order',
      name:  'orderAsc',
      by:    [{ field: 'order', direction: 'asc' }],
    },
    {
      title: 'Category',
      name:  'categoryAsc',
      by:    [{ field: 'category', direction: 'asc' }, { field: 'order', direction: 'asc' }],
    },
  ],
}
