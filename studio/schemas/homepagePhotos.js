// The photos at the top of the homepage, in one page with its own menu entry so
// they are easy to find and change: the hero slideshow, plus the decorative
// photos in the Events section.
//
// A single document (a "singleton"), not a list, and both are plain arrays:
//   - Sanity reorders arrays by dragging, no "Display Order" numbers to type.
//   - The slideshow cap lives here, on the array, so the Studio itself refuses an
//     11th photo and says why. (As separate documents an 11th would save happily
//     and then silently never appear on the website.)
//   - Nothing has to be published per photo: one Publish covers both lists.

export const MAX_HERO_SLIDES = 10

export const homepagePhotos = {
  name:  'homepagePhotos',
  title: 'Homepage Photos',
  type:  'document',

  fields: [
    {
      name:        'slides',
      title:       'Homepage Slideshow',
      type:        'array',
      of: [
        {
          type:  'object',
          name:  'heroSlide',
          title: 'Slide',
          fields: [
            {
              name:       'image',
              title:      'Photo',
              type:       'image',
              options:    { hotspot: true },
              validation: (Rule) => Rule.required().error('Please upload a photo.'),
            },
            {
              name:        'alt',
              title:       'Description for screen readers',
              type:        'string',
              description: 'What the photo shows, e.g. "Hotel lobby with armchairs". Blind visitors hear this, so please fill it in.',
              validation:  (Rule) => Rule.required().error('Please describe the photo — blind visitors hear this.'),
            },
            {
              name:        'headline',
              title:       'Caption over the photo (optional)',
              type:        'string',
              description: 'A short line of text shown over this photo. Leave blank for no caption.',
              validation:  (Rule) => Rule.max(80),
            },
          ],
          preview: {
            select: { title: 'alt', subtitle: 'headline', media: 'image' },
            prepare({ title, subtitle, media }) {
              return { title: title || 'Slide', subtitle: subtitle || 'No caption', media }
            },
          },
        },
      ],
      description: 'The big photos at the top of the homepage — up to 10, in this order. Until you add one, the photos the website was built with are shown, so it is never empty. From your first upload your photos lead and the built-in ones fill the remaining slots; at 10 uploads they are all yours.',
      validation:  (Rule) => Rule.max(MAX_HERO_SLIDES)
        .error(`The slideshow shows at most ${MAX_HERO_SLIDES} photos. Remove one before adding another.`),
    },

    {
      name:        'eventGallery',
      title:       'Events Gallery Images',
      type:        'array',
      of:          [{ type: 'image', options: { hotspot: true } }],
      description: 'The decorative event photos in the Events section. Upload any size — Sanity resizes automatically. Leave empty to keep the built-in photos.',
    },
  ],

  preview: { prepare: () => ({ title: 'Homepage Photos', subtitle: 'Slideshow (max 10) and Events gallery' }) },
}
