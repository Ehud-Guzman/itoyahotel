export const menuItem = {
  name:  'menuItem',
  title: 'Menu Item',
  type:  'document',
  fields: [
    {
      name:       'name',
      title:      'Dish Name',
      type:       'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name:        'description',
      title:       'Description',
      type:        'text',
      rows:        2,
      description: 'Brief description of the dish. Optional.',
    },
    {
      name:        'price',
      title:       'Price (KES)',
      type:        'number',
      description: 'Price in Kenyan Shillings.',
      validation:  (Rule) => Rule.required().positive().error('Price must be a positive number.'),
    },
    {
      name:    'category',
      title:   'Menu Category',
      type:    'string',
      options: {
        list: [
          { title: 'Breakfast',         value: 'Breakfast' },
          { title: 'Lunch',             value: 'Lunch' },
          { title: 'Dinner',            value: 'Dinner' },
          { title: 'Drinks & Beverages', value: 'Drinks' },
          { title: 'Desserts',          value: 'Desserts' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name:    'image',
      title:   'Dish Photo',
      type:    'image',
      options: { hotspot: true },
      description: 'Optional photo of the dish.',
    },
    {
      name:         'available',
      title:        'Currently Available',
      type:         'boolean',
      description:  'Uncheck to temporarily hide this item from the menu without deleting it.',
      initialValue: true,
    },
    {
      name:         'order',
      title:        'Display Order',
      type:         'number',
      description:  'Controls order within the category. Lower = appears first.',
      initialValue: 99,
    },
  ],
  preview: {
    select: {
      title:    'name',
      subtitle: 'category',
      price:    'price',
      media:    'image',
    },
    prepare({ title, subtitle, price, media }) {
      return {
        title,
        subtitle: `${subtitle} · KES ${price ? price.toLocaleString() : '—'}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Category then Order',
      name:  'categoryAndOrder',
      by:    [
        { field: 'category', direction: 'asc' },
        { field: 'order',    direction: 'asc' },
      ],
    },
  ],
}
