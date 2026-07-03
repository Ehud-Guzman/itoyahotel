export const testimonial = {
  name:  'testimonial',
  title: 'Testimonial',
  type:  'document',
  fields: [
    {
      name:       'quote',
      title:      'Quote',
      type:       'text',
      rows:       3,
      validation: (Rule) => Rule.required(),
    },
    {
      name:        'guestName',
      title:       'Guest Name',
      type:        'string',
      description: 'Full name, or "Anonymous Guest" if the guest prefers not to be named.',
      validation:  (Rule) => Rule.required(),
    },
    {
      name:        'role',
      title:       'Guest Type',
      type:        'string',
      description: 'e.g. "Business Traveller", "Conference Guest", "Returning Visitor".',
      validation:  (Rule) => Rule.required(),
    },
    {
      name:         'rating',
      title:        'Rating (1-5)',
      type:         'number',
      validation:   (Rule) => Rule.required().min(1).max(5),
      initialValue: 5,
    },
    {
      name:        'featured',
      title:       'Feature This Testimonial',
      type:        'boolean',
      description: 'Highlights this card visually. Use sparingly — one at a time reads best.',
      initialValue: false,
    },
    {
      name:         'order',
      title:        'Display Order',
      type:         'number',
      description:  'Lower numbers show first.',
      initialValue: 0,
    },
    {
      name:         'active',
      title:        'Show on Website',
      type:         'boolean',
      description:  'Uncheck to hide this testimonial without deleting it.',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title:    'guestName',
      subtitle: 'role',
    },
  },
  orderings: [
    {
      title: 'Display order',
      name:  'orderAsc',
      by:    [{ field: 'order', direction: 'asc' }],
    },
  ],
}
