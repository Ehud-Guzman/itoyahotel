import { galleryImage }           from './gallery'
import { amenityGroup, room }     from './room'
import { menuItem }               from './menuItem'
import { specialEvent }           from './specialEvent'
import { testimonial }            from './testimonial'
import { siteSettings }           from './siteSettings'

// Hero and event photos are arrays inside Site Settings (Homepage photos), so
// they have no documents of their own — there is nothing to list here.
export const schemas = [siteSettings, galleryImage, amenityGroup, room, menuItem, specialEvent, testimonial]
