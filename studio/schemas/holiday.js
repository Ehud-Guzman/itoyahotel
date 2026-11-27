// A holiday the hotel greets guests for. One document each: Christmas, Eid,
// Easter, Madaraka Day, Diwali, an anniversary — anything with dates and a line
// of greeting. Add as many in a year as you like: the website shows a holiday
// from its start date to its end date and is exactly as it always was in
// between.
//
// What a holiday changes on the site:
//   - the strip at the top of the header (its wording, and a button to book)
//   - the greeting above the homepage headline
//   - the invitation section under the hero (unless switched off below)
//   - the greeting above the Rooms and Dining headings, and in the footer
//   - the colour of the browser address bar on a phone
//
// `theme` picks how much decoration comes with it. "Christmas" is the full
// artwork (garland, baubles and snow); "Celebration" is gold without artwork;
// "Just a greeting" is the strip alone. Nothing else needs setting up — the
// dates are the whole schedule.

const ICONS = [
  { title: 'Sparkles (default)', value: 'sparkles' },
  { title: 'Star',               value: 'star' },
  { title: 'Christmas tree',     value: 'tree' },
  { title: 'Gift',               value: 'gift' },
  { title: 'Party popper',       value: 'party' },
  { title: 'Crescent moon',      value: 'moon' },
  { title: 'Flower',             value: 'flower' },
  { title: 'Heart',              value: 'heart' },
  { title: 'Cake',               value: 'cake' },
]

const THEMES = [
  { title: 'Christmas - garland, baubles and snow', value: 'christmas' },
  { title: 'Celebration - gold, no artwork',        value: 'sparkle' },
  { title: 'Just a greeting - the strip only',      value: 'simple' },
]

export const holiday = {
  name:  'holiday',
  title: 'Holiday',
  type:  'document',

  fieldsets: [
    { name: 'when',   title: 'When',            options: { collapsible: false } },
    { name: 'greet',  title: 'What guests read', options: { collapsible: false } },
    { name: 'invite', title: 'Invitation section under the hero', options: { collapsible: true, collapsed: true } },
    { name: 'look',   title: 'How it looks',     options: { collapsible: true, collapsed: true } },
  ],

  fields: [
    {
      name: 'title', title: 'Holiday name', type: 'string', fieldset: 'when',
      description: 'For you and the Studio list. Example: Christmas, Eid al-Fitr, Madaraka Day',
      validation: (Rule) => Rule.required().max(60),
    },
    {
      name: 'enabled', title: 'Show this holiday on the website', type: 'boolean',
      fieldset: 'when', initialValue: true,
      description: 'Switch off to keep it here without it appearing on the site.',
    },
    {
      name: 'startDate', title: 'First day', type: 'date', fieldset: 'when',
      description: 'Guests see the greeting from this day.',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'endDate', title: 'Last day', type: 'date', fieldset: 'when',
      description: 'The greeting stops the day after this one.',
      validation: (Rule) => Rule.required().custom((value, context) => {
        const start = context.document?.startDate
        if (!value || !start) return true
        return value >= start ? true : 'The last day has to be on or after the first day.'
      }),
    },

    {
      name: 'greeting', title: 'Greeting', type: 'string', fieldset: 'greet',
      description: 'The large line above the homepage headline, and the chatbot greeting. Keep it short. Example: Merry Christmas, Eid Mubarak, Happy Madaraka Day',
      validation: (Rule) => Rule.max(60),
    },
    {
      name: 'barText', title: 'Strip message', type: 'string', fieldset: 'greet',
      description: 'The line in the strip at the top of the page. Example: Merry Christmas from all of us at Hotel Itoya, Busia.',
      validation: (Rule) => Rule.max(140),
    },
    {
      name: 'barShort', title: 'Strip message on phones', type: 'string', fieldset: 'greet',
      description: 'Optional shorter version for small screens. Leave blank to use the message above.',
      validation: (Rule) => Rule.max(70),
    },
    {
      name: 'barCta', title: 'Strip button', type: 'string', fieldset: 'greet',
      description: 'The button at the end of the strip. It opens online booking. Default: Book your stay',
      initialValue: 'Book your stay',
      validation: (Rule) => Rule.max(28),
    },
    {
      name: 'icon', title: 'Icon in the strip', type: 'string', fieldset: 'greet',
      options: { layout: 'dropdown', list: ICONS },
      initialValue: 'sparkles',
    },

    {
      name: 'festive', title: 'Invitation under the hero', type: 'object', fieldset: 'invite',
      description: 'A short section inviting guests to stay, dine or celebrate. It points at the Rooms, Dining and Events sections the site already has.',
      options: { collapsible: false },
      fields: [
        {
          name: 'show', title: 'Show the invitation section', type: 'boolean', initialValue: true,
          description: 'Switch off for a solemn day, or if the greeting should stay in the strip only.',
        },
        { name: 'eyebrow', title: 'Small line above the title', type: 'string', description: 'Example: The Festive Season' },
        { name: 'title', title: 'Title', type: 'string', description: 'Example: Celebrate Christmas in Busia' },
        { name: 'body', title: 'Text', type: 'text', rows: 3, description: 'One or two sentences. No prices or promises.' },
      ],
    },

    {
      name: 'theme', title: 'Decoration', type: 'string', fieldset: 'look',
      options: { layout: 'radio', list: THEMES },
      initialValue: 'sparkle',
      description: 'Christmas suits December. The other two are neutral enough for Eid, Easter, national days and anniversaries.',
    },
    {
      name: 'snow', title: 'Falling snow', type: 'boolean', fieldset: 'look',
      initialValue: true,
      description: 'Only applies when the decoration is Christmas. Guests can always switch it off themselves.',
      hidden: ({ parent }) => parent?.theme !== 'christmas',
    },
    {
      name: 'slug', title: 'Web address name', type: 'slug', fieldset: 'look',
      options: { source: 'title', maxLength: 40 },
      description: 'Only used to remember which greeting a guest switched off, so they are not asked again. Press Generate.',
    },
  ],

  orderings: [
    { title: 'Soonest first', name: 'startAsc', by: [{ field: 'startDate', direction: 'asc' }] },
  ],

  preview: {
    select: { title: 'title', startDate: 'startDate', endDate: 'endDate', theme: 'theme', enabled: 'enabled' },
    prepare: ({ title, startDate, endDate, theme, enabled }) => ({
      title: title || 'Holiday',
      subtitle: [
        startDate ? `${startDate} → ${endDate || '…'}` : 'No dates yet',
        theme === 'christmas' ? 'Christmas' : theme === 'simple' ? 'Greeting only' : 'Celebration',
        enabled === false ? 'hidden' : '',
      ].filter(Boolean).join(' · '),
    }),
  },
}
