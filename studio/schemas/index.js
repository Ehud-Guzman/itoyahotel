import { galleryImage }           from './gallery'
import { amenityGroup, room }     from './room'
import { menuItem }               from './menuItem'
import { specialEvent }           from './specialEvent'
import { testimonial }            from './testimonial'
import { siteSettings }           from './siteSettings'
import { homepagePhotos }         from './homepagePhotos'
import { holiday }                from './holiday'

// Homepage photos (hero slideshow + Events gallery) are their own page rather
// than documents, so there is no list to browse: one "Homepage Photos" entry
// in the Studio's menu opens it.
//
// Holidays are the opposite: a growing list, one document each, so the hotel
// can add Christmas, Eid, Easter, a national day or an anniversary and have the
// site greet guests for those dates without anyone touching the code.
export const schemas = [siteSettings, homepagePhotos, holiday, galleryImage, amenityGroup, room, menuItem, specialEvent, testimonial]
