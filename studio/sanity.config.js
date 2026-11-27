import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemas } from './schemas'

const PROJECT_ID = 'okmatxt0'

// Documents that exist exactly once and are edited in place: they can be edited
// but not created a second time, deleted, unpublished or duplicated.
const SINGLETONS = ['siteSettings', 'homepagePhotos']

export default defineConfig({
  name:       'hotel-itoya',
  title:      'Hotel Itoya CMS',
  studioHost: 'hotel-itoya-cms',

  projectId: PROJECT_ID,
  dataset:   'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Hotel Itoya')
          .items([
            // One page of facts (phones, hours, booking switch...), not a list.
            S.listItem()
              .title('Site Settings')
              .icon(() => '⚙️')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
                  .title('Site Settings'),
              ),

            // The photos at the top of the homepage: the hero slideshow and the
            // Events gallery. Their own entry, on purpose — they are the most
            // edited thing on the site and must not be buried in Site Settings.
            S.listItem()
              .title('Homepage Photos')
              .icon(() => '🌄')
              .child(
                S.document()
                  .schemaType('homepagePhotos')
                  .documentId('homepagePhotos')
                  .title('Homepage Photos'),
              ),

            S.divider(),

            // Holidays & greetings: the hotel adds the dates and the wording, and
            // the website greets guests by itself from the start date to the end
            // date. No deploy, no developer.
            S.listItem()
              .title('Holidays & Greetings')
              .icon(() => '🎉')
              .schemaType('holiday')
              .child(S.documentTypeList('holiday').title('Holidays & Greetings')),

            S.listItem()
              .title('Gallery Images')
              .icon(() => '🖼')
              .schemaType('galleryImage')
              .child(S.documentTypeList('galleryImage').title('Gallery Images')),

            S.divider(),

            S.listItem()
              .title('Rooms')
              .icon(() => '🛏')
              .schemaType('room')
              .child(S.documentTypeList('room').title('Rooms')),

            S.divider(),

            S.listItem()
              .title('Dining Menu')
              .icon(() => '🍽')
              .schemaType('menuItem')
              .child(S.documentTypeList('menuItem').title('Menu Items')),

            S.divider(),

            S.listItem()
              .title('Special Events')
              .icon(() => '🎉')
              .schemaType('specialEvent')
              .child(S.documentTypeList('specialEvent').title('Special Events')),

            S.divider(),

            // Was missing: the schema existed, but there was no way to open it.
            S.listItem()
              .title('Testimonials')
              .icon(() => '💬')
              .schemaType('testimonial')
              .child(S.documentTypeList('testimonial').title('Testimonials')),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemas,
  },

  document: {
    // Singleton pages: edited in place, never created twice, deleted,
    // unpublished or duplicated.
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global'
        ? prev.filter((t) => !SINGLETONS.includes(t.templateId))
        : prev,
    actions: (prev, { schemaType }) =>
      SINGLETONS.includes(schemaType)
        ? prev.filter(({ action }) => !['unpublish', 'delete', 'duplicate'].includes(action))
        : prev,
  },
})
