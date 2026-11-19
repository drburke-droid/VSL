/* Contact lens data shared by the Contact Lens Explorer (lens-explorer/) and the
   Lens Scorecard (lens-scorecard/). Edit lenses, prices and notes here; both pages
   read this file. Fields: id, name, brand, sched ('Daily' | '1-week' | '2-week' | 'Monthly'),
   type ('SiHy' | 'Hydrogel'), dkt, water, cost (tier 1-4 or null), day (CAD per day, or null),
   optional gradient (surface water text), aka, and ourPrice (set when the price is our own store's). */
// ---- Lens data: manufacturer-published Dk/t at -3.00 D and water content (%) ----
// To add or remove a lens, edit this list. "gradient" marks water-gradient lenses (core value plotted).
// "cost" is a rough online price tier within the lens's replacement class (1 = $ ... 4 = $$$$; null = not compared).
// Basis: cost per day of wear per eye (CAD), regular pre-sale box prices at Clearly.ca, November 2026
// (Avaira Vitality and Proclear estimated, as Clearly.ca doesn't sell them). Exception: Ultra One Day uses
// our own online store's price, $90 for a box of 90 (November 2026); "ourPrice" marks it so both pages say so.
// Tier = ratio to the median of the class: $ < 0.90, $$ 0.90-1.15, $$$ 1.15-1.35, $$$$ >= 1.35.
// "day" is that cost per day of wear (CAD, one eye); the overall score compares it across all lenses.
// Daily (median $1.16/day): AquaComfort Plus 0.78, Biotrue 0.92, Proclear 1 day 0.99, Ultra One Day 1.00 (our store),
//   Moist 1.03, SofLens DD 1.13, clariti 1.16, Precision1 1.22, Oasys 1-Day 1.29, Total1 1.32, MyDay 1.50, Oasys MAX 1.82,
//   MyDay Energys 2.02
// 1-2 week (median $0.47/day): Avaira Vitality ~0.43, Acuvue Oasys 0.43, Acuvue 2 0.51, Precision7 0.63
// Monthly (median $0.40/day): Air Optix plus HydraGlyde 0.25, Biofinity 0.35, Proclear ~0.39, Ultra 0.39, Vita 0.40,
//   Biofinity Energys 0.44, Total30 0.49, PureVision2 0.56, Air Optix Night & Day Aqua 0.58
window.LENS_DATA = [
  { id: 'ultra1d',     name: 'Ultra One Day',              brand: 'Bausch + Lomb',     sched: 'Daily',   type: 'SiHy',     dkt: 134,  water: 55, cost: 1, day: 1.00, ourPrice: '$90 for a box of 90', aka: 'Sold as INFUSE in the US' },
  { id: 'total1',      name: 'Dailies Total1',             brand: 'Alcon',             sched: 'Daily',   type: 'SiHy',     dkt: 156,  water: 33, cost: 2, day: 1.32, gradient: 'over 80%' },
  { id: 'oasys1d',     name: 'Acuvue Oasys 1-Day',         brand: 'Johnson & Johnson', sched: 'Daily',   type: 'SiHy',     dkt: 121,  water: 38, cost: 2, day: 1.29 },
  { id: 'oasysmax',    name: 'Acuvue Oasys MAX 1-Day',     brand: 'Johnson & Johnson', sched: 'Daily',   type: 'SiHy',     dkt: 121,  water: 38, cost: 4, day: 1.82 },
  { id: 'precision1',  name: 'Precision1',                 brand: 'Alcon',             sched: 'Daily',   type: 'SiHy',     dkt: 100,  water: 51, cost: 2, day: 1.22, gradient: 'over 80%' },
  { id: 'myday',       name: 'MyDay',                      brand: 'CooperVision',      sched: 'Daily',   type: 'SiHy',     dkt: 100,  water: 54, cost: 3, day: 1.5 },
  { id: 'mydayen',     name: 'MyDay Energys',              brand: 'CooperVision',      sched: 'Daily',   type: 'SiHy',     dkt: 100,  water: 54, cost: 4, day: 2.02 },
  { id: 'clariti',     name: 'clariti 1 day',              brand: 'CooperVision',      sched: 'Daily',   type: 'SiHy',     dkt: 86,   water: 56, cost: 2, day: 1.16 },
  { id: 'biotrue',     name: 'Biotrue ONEday',             brand: 'Bausch + Lomb',     sched: 'Daily',   type: 'Hydrogel', dkt: 42,   water: 78, cost: 1, day: 0.92 },
  { id: 'aqcplus',     name: 'Dailies AquaComfort Plus',   brand: 'Alcon',             sched: 'Daily',   type: 'Hydrogel', dkt: 26,   water: 69, cost: 1, day: 0.78 },
  { id: 'moist',       name: '1-Day Acuvue Moist',         brand: 'Johnson & Johnson', sched: 'Daily',   type: 'Hydrogel', dkt: 25.5, water: 58, cost: 1, day: 1.03 },
  { id: 'proclear1d',  name: 'Proclear 1 day',             brand: 'CooperVision',      sched: 'Daily',   type: 'Hydrogel', dkt: 28,   water: 60, cost: 1, day: 0.99 },
  { id: 'soflensdd',   name: 'SofLens Daily Disposable',   brand: 'Bausch + Lomb',     sched: 'Daily',   type: 'Hydrogel', dkt: 24,   water: 59, cost: 2, day: 1.13 },
  { id: 'precision7',  name: 'Precision7',                 brand: 'Alcon',             sched: '1-week',  type: 'SiHy',     dkt: 149,  water: 55, cost: 3, day: 0.63 },
  { id: 'oasys2w',     name: 'Acuvue Oasys (2-week)',      brand: 'Johnson & Johnson', sched: '2-week',  type: 'SiHy',     dkt: 147,  water: 38, cost: 2, day: 0.43 },
  { id: 'avaira',      name: 'Avaira Vitality',            brand: 'CooperVision',      sched: '2-week',  type: 'SiHy',     dkt: 112,  water: 55, cost: 2, day: 0.43 },
  { id: 'acuvue2',     name: 'Acuvue 2',                   brand: 'Johnson & Johnson', sched: '2-week',  type: 'Hydrogel', dkt: 25.5, water: 58, cost: 2, day: 0.51 },
  { id: 'soflens38',   name: 'SofLens 38',                 brand: 'Bausch + Lomb',     sched: '2-week',  type: 'Hydrogel', dkt: 24.3, water: 38, cost: null, day: null },
  { id: 'biofinity',   name: 'Biofinity',                  brand: 'CooperVision',      sched: 'Monthly', type: 'SiHy',     dkt: 171,  water: 48, cost: 1, day: 0.35 },
  { id: 'biofinityen', name: 'Biofinity Energys',          brand: 'CooperVision',      sched: 'Monthly', type: 'SiHy',     dkt: 171,  water: 48, cost: 2, day: 0.44 },
  { id: 'aoplus',      name: 'Air Optix plus HydraGlyde',  brand: 'Alcon',             sched: 'Monthly', type: 'SiHy',     dkt: 138,  water: 33, cost: 1, day: 0.25 },
  { id: 'aond',        name: 'Air Optix Night & Day Aqua', brand: 'Alcon',             sched: 'Monthly', type: 'SiHy',     dkt: 175,  water: 24, cost: 4, day: 0.58 },
  { id: 'total30',     name: 'Total30',                    brand: 'Alcon',             sched: 'Monthly', type: 'SiHy',     dkt: 154,  water: 55, cost: 3, day: 0.49, gradient: 'nearly 100%' },
  { id: 'ultra',       name: 'Ultra (monthly)',            brand: 'Bausch + Lomb',     sched: 'Monthly', type: 'SiHy',     dkt: 163,  water: 46, cost: 2, day: 0.39 },
  { id: 'pv2',         name: 'PureVision2',                brand: 'Bausch + Lomb',     sched: 'Monthly', type: 'SiHy',     dkt: 130,  water: 36, cost: 4, day: 0.56 },
  { id: 'vita',        name: 'Acuvue Vita',                brand: 'Johnson & Johnson', sched: 'Monthly', type: 'SiHy',     dkt: 147,  water: 41, cost: 2, day: 0.4 },
  { id: 'proclear',    name: 'Proclear',                   brand: 'CooperVision',      sched: 'Monthly', type: 'Hydrogel', dkt: 36,   water: 62, cost: 2, day: 0.39 }
];

// ---- Our online store (Otto) and booking, used by the Lens Scorecard's boarding pass ----
// A lens listed in "products" gets an "Order online" button that opens its page in our store.
// The number is the prodid in the product page's address, e.g. .../reorder/product/view/?prodid=000199.
// Only add a lens once our store carries it: a number our store doesn't carry opens another product.
// Product numbers are shared across Otto stores; ones seen on other clinics' stores (November 2026),
// for when we add them: ACUVUE OASYS 1-Day 90pk 000012, ACUVUE OASYS 2-week 24pk 000016,
// ACUVUE VITA 6pk 000022, Biofinity 6pk 000039, DAILIES TOTAL1 90pk 001245 (also 000054),
// MyDay 90pk 000087, Ultra 6pk 000115, Precision1 90pk 000190, TOTAL30 6pk 000212,
// ACUVUE OASYS MAX 1-Day 90pk 000525. Check each in our store before adding it.
window.LENS_STORE = {
  product: 'https://calgaryvisioncentre.ottooptics.io/reorder/product/view/?prodid=',
  shop: 'https://calgaryvisioncentre.ottooptics.io/reorder/',
  book: 'https://calgaryvisioncentre.com/book-an-appointment',
  products: {
    ultra1d: '000199'   // Ultra One Day (90 pack), checked in our store November 2026
  }
};
