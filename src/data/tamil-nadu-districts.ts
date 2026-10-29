// The 38 districts of Tamil Nadu, alphabetical. `hq` is the approximate position of each district's
// headquarters town (decimal degrees, about two decimal places). It is used only to *suggest* the
// nearest district after a customer shares their location; the customer always confirms the choice,
// because the nearest headquarters is not always the district a point lies in.
// Delivery coverage is not configured for any district (see lib/delivery-location.ts).

export interface District {
  name: string;
  hq: { lat: number; lng: number };
}

export const tamilNaduDistricts: District[] = [
  { name: "Ariyalur", hq: { lat: 11.14, lng: 79.08 } },
  { name: "Chengalpattu", hq: { lat: 12.69, lng: 79.98 } },
  { name: "Chennai", hq: { lat: 13.08, lng: 80.27 } },
  { name: "Coimbatore", hq: { lat: 11.02, lng: 76.96 } },
  { name: "Cuddalore", hq: { lat: 11.75, lng: 79.75 } },
  { name: "Dharmapuri", hq: { lat: 12.13, lng: 78.16 } },
  { name: "Dindigul", hq: { lat: 10.36, lng: 77.98 } },
  { name: "Erode", hq: { lat: 11.34, lng: 77.72 } },
  { name: "Kallakurichi", hq: { lat: 11.74, lng: 78.96 } },
  { name: "Kancheepuram", hq: { lat: 12.83, lng: 79.7 } },
  { name: "Kanniyakumari", hq: { lat: 8.18, lng: 77.41 } },
  { name: "Karur", hq: { lat: 10.96, lng: 78.08 } },
  { name: "Krishnagiri", hq: { lat: 12.52, lng: 78.21 } },
  { name: "Madurai", hq: { lat: 9.93, lng: 78.12 } },
  { name: "Mayiladuthurai", hq: { lat: 11.1, lng: 79.65 } },
  { name: "Nagapattinam", hq: { lat: 10.77, lng: 79.84 } },
  { name: "Namakkal", hq: { lat: 11.22, lng: 78.17 } },
  { name: "Nilgiris", hq: { lat: 11.41, lng: 76.7 } },
  { name: "Perambalur", hq: { lat: 11.23, lng: 78.88 } },
  { name: "Pudukkottai", hq: { lat: 10.38, lng: 78.82 } },
  { name: "Ramanathapuram", hq: { lat: 9.37, lng: 78.83 } },
  { name: "Ranipet", hq: { lat: 12.93, lng: 79.33 } },
  { name: "Salem", hq: { lat: 11.66, lng: 78.15 } },
  { name: "Sivaganga", hq: { lat: 9.85, lng: 78.48 } },
  { name: "Tenkasi", hq: { lat: 8.96, lng: 77.3 } },
  { name: "Thanjavur", hq: { lat: 10.79, lng: 79.14 } },
  { name: "Theni", hq: { lat: 10.01, lng: 77.48 } },
  { name: "Thoothukudi", hq: { lat: 8.76, lng: 78.13 } },
  { name: "Tiruchirappalli", hq: { lat: 10.79, lng: 78.7 } },
  { name: "Tirunelveli", hq: { lat: 8.71, lng: 77.76 } },
  { name: "Tirupathur", hq: { lat: 12.5, lng: 78.57 } },
  { name: "Tiruppur", hq: { lat: 11.11, lng: 77.34 } },
  { name: "Tiruvallur", hq: { lat: 13.14, lng: 79.91 } },
  { name: "Tiruvannamalai", hq: { lat: 12.23, lng: 79.07 } },
  { name: "Tiruvarur", hq: { lat: 10.77, lng: 79.64 } },
  { name: "Vellore", hq: { lat: 12.92, lng: 79.13 } },
  { name: "Viluppuram", hq: { lat: 11.94, lng: 79.49 } },
  { name: "Virudhunagar", hq: { lat: 9.58, lng: 77.96 } },
];
