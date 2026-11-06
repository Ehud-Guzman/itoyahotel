import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemas } from './schemas'

const PROJECT_ID = 'okmatxt0'

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

            S.divider(),

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
    // Site Settings is a single page: it can be edited, but not created twice,
    // deleted, unpublished or duplicated.
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global' ? prev.filter((t) => t.templateId !== 'siteSettings') : prev,
    actions: (prev, { schemaType }) =>
      schemaType === 'siteSettings'
        ? prev.filter(({ action }) => !['unpublish', 'delete', 'duplicate'].includes(action))
        : prev,
  },
})
