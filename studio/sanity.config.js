import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemas } from './schemas'

const PROJECT_ID = 'okmatxt0'

export default defineConfig({
  name:       'hotel-itoya',
  title:      'Hotel Itoya CMS',
  studioHost: 'hotel-itoya',

  projectId: PROJECT_ID,
  dataset:   'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Hotel Itoya')
          .items([
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
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemas,
  },
})
