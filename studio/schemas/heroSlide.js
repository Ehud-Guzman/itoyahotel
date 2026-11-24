export const heroSlide = {
  name:  'heroSlide',
  title: 'Hero Slide',
  type:  'document',
  description: 'One photo in the homepage slideshow. Up to 10 photos are shown in total — the ones you add here come first, and the built-in photos fill any slots left over. Delete one and a built-in photo takes its place. Upload any size; Sanity resizes it automatically for each screen.',
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
      title:       'Alt Text',
      type:        'string',
      description: 'Describe what is shown (e.g. "Hotel Lobby", "Deluxe Room View"). Used for accessibility.',
      validation:  (Rule) => Rule.required().error('Alt text is required for accessibility.'),
    },
    {
      name:        'headline',
      title:       'Headline Overlay',
      type:        'string',
      description: 'Optional short text shown over the image on the slide. Leave blank to use the default hero wording.',
      validation:  (Rule) => Rule.max(80),
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
    select: { title: 'alt', subtitle: 'order', media: 'image' },
    prepare({ title, subtitle, media }) {
      return { title, subtitle: `Slide ${subtitle ?? '—'}`, media }
    },
  },
  orderings: [
    { title: 'Display Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
}