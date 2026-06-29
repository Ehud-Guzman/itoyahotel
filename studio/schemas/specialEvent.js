export const specialEvent = {
  name:  'specialEvent',
  title: 'Special Event',
  type:  'document',
  fields: [
    {
      name:       'title',
      title:      'Event Title',
      type:       'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name:    'date',
      title:   'Event Date',
      type:    'date',
      options: { dateFormat: 'MMMM D, YYYY' },
      validation: (Rule) => Rule.required(),
    },
    {
      name:        'description',
      title:       'Event Description',
      type:        'text',
      rows:        3,
      description: 'Brief description of the event. Optional.',
    },
    {
      name:    'category',
      title:   'Event Type',
      type:    'string',
      options: {
        list: [
          { title: 'Wedding Reception',  value: 'Wedding' },
          { title: 'Corporate Event',    value: 'Corporate' },
          { title: 'Cultural Celebration', value: 'Cultural' },
          { title: 'Outside Catering',   value: 'Catering' },
          { title: 'Other',              value: 'Other' },
        ],
        layout: 'radio',
      },
    },
    {
      name:       'image',
      title:      'Event Photo',
      type:       'image',
      options:    { hotspot: true },
      validation: (Rule) => Rule.required().error('An event photo is required.'),
    },
    {
      name:         'active',
      title:        'Show on Website',
      type:         'boolean',
      description:  'Uncheck to hide this event without deleting it.',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title:    'title',
      subtitle: 'date',
      media:    'image',
    },
    prepare({ title, subtitle, media }) {
      const formatted = subtitle
        ? new Date(subtitle).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Date not set'
      return { title, subtitle: formatted, media }
    },
  },
  orderings: [
    {
      title: 'Date (upcoming first)',
      name:  'dateAsc',
      by:    [{ field: 'date', direction: 'asc' }],
    },
  ],
}
