// One page of facts about the hotel that appear all over the website: phone
// numbers, email, hours, social links, plus two switches (pause online booking,
// hide the festive theme). Edit here and the site, the chatbot, the booking
// emails and the receipt all follow. It is a single document (a "singleton"),
// so the Studio shows it as one page rather than a list.
//
// Every field is optional: anything left blank keeps the value the website was
// built with, so it is always safe to change just one thing.

const phoneRule = (Rule) =>
  Rule.regex(/^[+\d\s()-]{9,24}$/, { name: 'phone number' }).error('Use digits, spaces, + and - only, e.g. +254 714 302 777')

export const siteSettings = {
  name:  'siteSettings',
  title: 'Site Settings',
  type:  'document',

  fieldsets: [
    { name: 'contact', title: 'Contact details',  options: { collapsible: true, collapsed: false } },
    { name: 'hours',   title: 'Times and hours',  options: { collapsible: true, collapsed: false } },
    { name: 'social',  title: 'Social media',     options: { collapsible: true, collapsed: true } },
    { name: 'booking', title: 'Online booking',   options: { collapsible: true, collapsed: false } },
    { name: 'look',    title: 'Website look',     options: { collapsible: true, collapsed: true } },
  ],

  fields: [
    {
      name: 'phones', title: 'Phone numbers', type: 'array', fieldset: 'contact',
      of: [{ type: 'string', validation: phoneRule }],
      description: 'Up to 5. The first one is shown first everywhere. Example: +254 714 302 777',
      validation: (Rule) => Rule.max(5),
    },
    {
      name: 'whatsapp', title: 'WhatsApp number', type: 'string', fieldset: 'contact',
      description: 'Country code first, numbers only. Example: 254714302777. Used by every "WhatsApp us" button.',
      validation: (Rule) => Rule.regex(/^\+?[\d\s]{9,16}$/, { name: 'WhatsApp number' }).error('Numbers only, with the country code. Example: 254714302777'),
    },
    {
      name: 'email', title: 'Email address', type: 'string', fieldset: 'contact',
      description: 'Shown on the website and in booking confirmation emails. (Where booking alerts are delivered is set separately by the developer.)',
      validation: (Rule) => Rule.email(),
    },
    { name: 'addressLine', title: 'Street / road', type: 'string', fieldset: 'contact', description: 'Example: B1 Kisumu-Busia Road' },
    { name: 'town',        title: 'Town and country', type: 'string', fieldset: 'contact', description: 'Example: Busia, Kenya' },

    { name: 'reservationsHours', title: 'Reservations team hours', type: 'string', fieldset: 'hours', description: 'Example: Daily 7 AM – 10 PM' },
    { name: 'frontDeskHours',    title: 'Front desk hours',        type: 'string', fieldset: 'hours', description: 'Example: 24 Hours' },
    { name: 'checkInTime',       title: 'Check-in from',           type: 'string', fieldset: 'hours', description: 'Example: 2:00 PM' },
    { name: 'checkOutTime',      title: 'Check-out by',            type: 'string', fieldset: 'hours', description: 'Example: 10:00 AM' },
    { name: 'breakfastHours',    title: 'Breakfast hours',         type: 'string', fieldset: 'hours', description: 'Example: 6:30 AM – 10:00 AM' },
    { name: 'lunchHours',        title: 'Lunch hours',             type: 'string', fieldset: 'hours', description: 'Example: 12:00 PM – 3:00 PM' },
    { name: 'dinnerHours',       title: 'Dinner hours',            type: 'string', fieldset: 'hours', description: 'Example: 6:00 PM – 10:00 PM' },

    { name: 'facebookUrl',  title: 'Facebook page link',  type: 'url', fieldset: 'social', validation: (Rule) => Rule.uri({ scheme: ['https', 'http'] }) },
    { name: 'instagramUrl', title: 'Instagram link',      type: 'url', fieldset: 'social', validation: (Rule) => Rule.uri({ scheme: ['https', 'http'] }) },

    {
      name: 'bookingOpen', title: 'Accept online bookings', type: 'boolean', fieldset: 'booking', initialValue: true,
      description: 'Switch OFF to stop new online bookings straight away (full house, renovation, a public holiday). Guests then see your message below and can still phone or WhatsApp you. Switch back ON to resume.',
    },
    {
      name: 'bookingPausedMessage', title: 'Message shown while booking is paused', type: 'text', rows: 2, fieldset: 'booking',
      description: 'Example: "We are fully booked this weekend. Please call us on +254 714 302 777." Leave blank to use a standard message.',
      validation: (Rule) => Rule.max(300),
    },

    {
      name: 'festiveTheme', title: 'Festive Christmas theme', type: 'string', fieldset: 'look', initialValue: 'auto',
      options: {
        layout: 'radio',
        list: [
          { title: 'Automatic: appears 1 December and ends 5 January', value: 'auto' },
          { title: 'Never show it', value: 'off' },
        ],
      },
      description: 'The theme starts and ends by itself. Choose "Never show it" if you would rather not have it this year.',
    },
  ],

  preview: { prepare: () => ({ title: 'Site Settings', subtitle: 'Phones, email, hours, booking switch' }) },
}
