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

  fieldsets: [
    { name: 'local', title: 'Rates for Kenyan residents (KES per night)',   options: { collapsible: true, collapsed: false } },
    { name: 'intl',  title: 'Rates for international visitors (USD per night)', options: { collapsible: true, collapsed: false } },
  ],

  fields: [
    {
      name:        'roomType',
      title:       'Room type',
      type:        'string',
      description: 'Which of the four bookable rooms this is. The price, guests and availability below are what guests see AND are charged on the booking form. Each room type can be used by one room only.',
      options: {
        layout: 'radio',
        list: [
          { title: 'Standard Room',     value: 'standard' },
          { title: 'Deluxe Room',       value: 'deluxe' },
          { title: 'Super Deluxe Room', value: 'super-deluxe' },
          { title: 'Executive Room',    value: 'executive' },
        ],
      },
      validation: (Rule) => Rule.required().custom(async (value, context) => {
        if (!value) return true
        const client = context.getClient({ apiVersion: '2024-06-01' })
        const id = (context.document?._id || '').replace(/^drafts\./, '')
        const others = await client.fetch(
          'count(*[_type == "room" && roomType == $type && !(_id in [$id, "drafts." + $id])])',
          { type: value, id },
        )
        return others > 0 ? 'Another room already uses this room type. Edit that one instead of adding a new one.' : true
      }),
    },
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
      description: 'One or two lines shown on the room card. Leave blank to keep the current wording.',
      validation:  (Rule) => Rule.max(220),
    },
    {
      name:        'longDescription',
      title:       'Full Description',
      type:        'text',
      rows:        4,
      description: 'Longer text shown in the room detail popup. Leave blank to keep the current wording.',
    },
    {
      name:        'pricePerNight',
      title:       'Bed & Breakfast: Kenyan residents (KES)',
      type:        'number',
      fieldset:    'local',
      description: 'Nightly rate in Kenyan Shillings, e.g. 3500. This is the price Kenyan residents are shown AND charged when they book, and it updates the room cards, booking form and chatbot within about a minute of publishing.',
      validation:  (Rule) => Rule.required().min(500).max(200000).error('Enter a nightly price between 500 and 200,000.'),
    },
    {
      name:        'halfBoardPrice',
      title:       'Half Board: Kenyan residents (KES)',
      type:        'number',
      fieldset:    'local',
      description: 'Leave blank if Half Board is not offered to Kenyan residents. Enter 0 to stop offering it.',
      validation:  (Rule) => Rule.min(0).max(200000),
    },
    {
      name:        'fullBoardPrice',
      title:       'Full Board: Kenyan residents (KES)',
      type:        'number',
      fieldset:    'local',
      description: 'Leave blank if Full Board is not offered to Kenyan residents. Enter 0 to stop offering it.',
      validation:  (Rule) => Rule.min(0).max(200000),
    },
    {
      name:        'intlBedAndBreakfast',
      title:       'Bed & Breakfast: international (USD)',
      type:        'number',
      fieldset:    'intl',
      description: 'Nightly rate in US dollars, e.g. 62. International visitors reserve online and pay at the hotel. Leave blank to keep the rate the website already has. Enter 0 to stop offering this plan.',
      validation:  (Rule) => Rule.min(0).max(5000),
    },
    {
      name:        'intlHalfBoard',
      title:       'Half Board: international (USD)',
      type:        'number',
      fieldset:    'intl',
      description: 'Leave blank to keep the rate the website already has. Enter 0 to stop offering this plan.',
      validation:  (Rule) => Rule.min(0).max(5000),
    },
    {
      name:        'intlFullBoard',
      title:       'Full Board: international (USD)',
      type:        'number',
      fieldset:    'intl',
      description: 'Leave blank to keep the rate the website already has. Enter 0 to stop offering this plan.',
      validation:  (Rule) => Rule.min(0).max(5000),
    },
    {
      name:        'priceNote',
      title:       'Price note',
      type:        'string',
      description: 'Small print next to the price. Example: Bed & Breakfast included',
      initialValue: 'Bed & Breakfast included',
      validation:  (Rule) => Rule.max(60),
    },
    {
      name:        'maxGuests',
      title:       'Maximum guests',
      type:        'number',
      description: 'The most guests allowed in this room. The booking form will not accept more.',
      validation:  (Rule) => Rule.required().integer().min(1).max(10),
    },
    {
      name:         'available',
      title:        'Available for online booking',
      type:         'boolean',
      initialValue: true,
      description:  'Switch OFF when this room type is full or out of service. It then shows as unavailable on the booking form. Switch back ON to reopen it.',
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
      description: 'First image is the main card image. Add more for the room gallery popup. Leave empty to keep the current photos.',
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
