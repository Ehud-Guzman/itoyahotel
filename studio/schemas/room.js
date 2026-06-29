export const amenityGroup = {
  name:  'amenityGroup',
  title: 'Amenity Group',
  type:  'object',
  fields: [
    {
      name:        'label',
      title:       'Group Label',
      type:        'string',
      description: 'e.g. "Sleeping", "In-Room", "Bathroom", "Services"',
      validation:  (Rule) => Rule.required(),
    },
    {
      name:  'items',
      title: 'Amenity Items',
      type:  'array',
      of:    [{ type: 'string' }],
      description: 'List the individual amenities (e.g. "King Bed", "Free Wi-Fi").',
    },
  ],
}

export const room = {
  name:  'room',
  title: 'Room',
  type:  'document',
  fields: [
    {
      name:        'title',
      title:       'Room Name',
      type:        'string',
      description: 'e.g. "Standard Room", "Deluxe Room", "Executive Room"',
      validation:  (Rule) => Rule.required(),
    },
    {
      name:        'tag',
      title:       'Badge Label',
      type:        'string',
      description: 'Short label on the room card (e.g. "Standard", "Deluxe").',
      validation:  (Rule) => Rule.required(),
    },
    {
      name:        'description',
      title:       'Short Description',
      type:        'text',
      rows:        2,
      description: 'One or two lines shown on the room card. Keep it concise.',
      validation:  (Rule) => Rule.required().max(220),
    },
    {
      name:        'longDescription',
      title:       'Full Description',
      type:        'text',
      rows:        4,
      description: 'Longer text shown in the room detail popup.',
      validation:  (Rule) => Rule.required(),
    },
    {
      name:        'pricePerNight',
      title:       'Price Per Night (KES)',
      type:        'number',
      description: 'Nightly rate in Kenyan Shillings. Leave blank to hide price.',
    },
    {
      name:         'featured',
      title:        'Featured Room',
      type:         'boolean',
      description:  'Highlight this room with a gold border on the website.',
      initialValue: false,
    },
    {
      name:    'images',
      title:   'Room Images',
      type:    'array',
      of:      [{ type: 'image', options: { hotspot: true } }],
      description: 'First image is the main card image. Add more for the room gallery popup.',
      validation: (Rule) => Rule.required().min(1).error('At least one room image is required.'),
    },
    {
      name:        'features',
      title:       'Feature Tags',
      type:        'array',
      of:          [{ type: 'string' }],
      description: 'Short tags shown on the card (e.g. "King Bed", "Free Wi-Fi", "Sea View").',
    },
    {
      name:        'amenities',
      title:       'Amenities',
      type:        'array',
      of:          [{ type: 'amenityGroup' }],
      description: 'Grouped amenity lists shown in the room detail popup.',
    },
    {
      name:         'order',
      title:        'Display Order',
      type:         'number',
      description:  'Controls the order rooms appear. 1 = first on the page.',
      initialValue: 99,
    },
  ],
  preview: {
    select: {
      title:    'title',
      subtitle: 'pricePerNight',
      media:    'images.0',
    },
    prepare({ title, subtitle, media }) {
      return {
        title,
        subtitle: subtitle ? `KES ${subtitle.toLocaleString()} / night` : 'Price not set',
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Display Order',
      name:  'orderAsc',
      by:    [{ field: 'order', direction: 'asc' }],
    },
  ],
}
