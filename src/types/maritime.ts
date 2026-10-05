export type UserRole = 'admin' | 'manager' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  status: 'Aktif' | 'Nonaktif';
  createdAt: string;
  updatedAt: string;
}

export type VesselType = 'Container' | 'Tanker' | 'Bulk Carrier' | 'Tugboat & Barge' | 'Ro-Ro / Passenger';
export type VesselStatus = 'Berlayar' | 'Sandar/Dermaga' | 'Maintenance/Dok' | 'Siap Muat';

export interface Vessel {
  id: string;
  name: string;
  code: string;
  vesselType: VesselType;
  flag: string;
  imoNumber: string;
  capacityDwt: number; // Deadweight Tonnage
  capacityTeu: number; // Twenty-foot Equivalent Unit (for containers)
  yearBuilt: number;
  status: VesselStatus;
  imageUrl?: string;
  lengthMeters: number;
  beamMeters: number;
  createdAt: string;
  updatedAt: string;
}

export interface Port {
  id: string;
  code: string;
  name: string;
  city: string;
  province: string;
  country: string;
  dockType: string;
  draftDepthMeters: number;
  berthFeePerDay: number;
  status: 'Aktif' | 'Renovasi' | 'Penuh';
  createdAt: string;
  updatedAt: string;
}

export type CargoCategory = 'General Cargo' | 'Liquid Bulk' | 'Dry Bulk' | 'Container 20ft' | 'Container 40ft' | 'Dangerous Goods';
export type CargoUnit = 'Ton' | 'TEU' | 'M3' | 'KL';

export interface Cargo {
  id: string;
  code: string;
  name: string;
  category: CargoCategory;
  unit: CargoUnit;
  baseTariffPerUnit: number; // in IDR
  description: string;
  hazardClass?: string;
  createdAt: string;
  updatedAt: string;
}

export type CrewRole = 'Kapten / Nakhoda' | 'Mualim I' | 'Mualim II' | 'KKM / Chief Engineer' | 'Masinis II' | 'Kelasi / AB';

export interface Crew {
  id: string;
  nik: string;
  name: string;
  role: CrewRole;
  assignedVesselId?: string;
  assignedVesselName?: string;
  certification: string;
  phone: string;
  email: string;
  status: 'Aktif' | 'Cuti' | 'Sakit' | 'Nonaktif';
  createdAt: string;
  updatedAt: string;
}

export type CustomerCategory = 'Shipper' | 'Freight Forwarder' | 'Corporate' | 'Logistic Partner';

export interface Customer {
  id: string;
  code: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  category: CustomerCategory;
  creditLimit: number; // in IDR
  status: 'Aktif' | 'Suspend';
  createdAt: string;
  updatedAt: string;
}

export type VoyageStatus = 'Scheduled' | 'Loading' | 'In Transit' | 'Unloading' | 'Completed' | 'Cancelled';

export interface Voyage {
  id: string;
  voyageNumber: string; // e.g. VYG-2026-001
  vesselId: string;
  vesselName: string;
  originPortId: string;
  originPortName: string;
  destinationPortId: string;
  destinationPortName: string;
  etd: string; // Estimated Time Departure
  eta: string; // Estimated Time Arrival
  actualDeparture?: string;
  actualArrival?: string;
  captainName: string;
  status: VoyageStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'On Board' | 'Delivered' | 'Cancelled';

export interface Booking {
  id: string;
  bookingNumber: string; // e.g. BKO-2026-801
  bookingDate: string;
  customerId: string;
  customerName: string;
  voyageId: string;
  voyageNumber: string;
  cargoId: string;
  cargoName: string;
  quantity: number;
  unit: CargoUnit;
  originPortName: string;
  destinationPortName: string;
  totalPrice: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ManifestStatus = 'Loaded' | 'In Transit' | 'Discharged';

export interface Manifest {
  id: string;
  manifestNumber: string; // e.g. MNF-2026-011
  voyageId: string;
  voyageNumber: string;
  containerOrSealNo: string;
  shipperName: string;
  consigneeName: string;
  description: string;
  weightKg: number;
  volumeM3: number;
  bayLocation: string;
  status: ManifestStatus;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'Belum Lunas' | 'Sebagian' | 'Lunas' | 'Jatuh Tempo';

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-101
  bookingId: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  freightCharge: number;
  handlingFee: number;
  portFee: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
