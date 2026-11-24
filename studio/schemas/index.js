import { galleryImage }           from './gallery'
import { amenityGroup, room }     from './room'
import { menuItem }               from './menuItem'
import { specialEvent }           from './specialEvent'
import { testimonial }            from './testimonial'
import { siteSettings }           from './siteSettings'
import { homepagePhotos }         from './homepagePhotos'

// Homepage photos (hero slideshow + Events gallery) are their own page rather
// than documents, so there is no list to browse: one "Homepage Photos" entry
// in the Studio's menu opens it.
export const schemas = [siteSettings, homepagePhotos, galleryImage, amenityGroup, room, menuItem, specialEvent, testimonial]
