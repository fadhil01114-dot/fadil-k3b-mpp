import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Vessel, Port, Cargo, Crew, Customer, Voyage, Booking, Manifest, Invoice } from '../types/maritime';

export async function seedInitialDatabaseIfEmpty() {
  try {
    const vesselsSnap = await getDocs(collection(db, 'vessels'));
    if (!vesselsSnap.empty) {
      console.log('Database already populated. Skipping initial seed.');
      return;
    }

    console.log('Seeding initial maritime database into Firestore...');
    const now = new Date().toISOString();

    // 1. Seed Vessels
    const vessels: Vessel[] = [
      {
        id: 'vessel-01',
        name: 'MV Samudra Nusantara',
        code: 'VSL-SN-01',
        vesselType: 'Container',
        flag: 'Indonesia',
        imoNumber: 'IMO 9821401',
        capacityDwt: 32000,
        capacityTeu: 2500,
        yearBuilt: 2019,
        status: 'Berlayar',
        imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80',
        lengthMeters: 198,
        beamMeters: 32,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'vessel-02',
        name: 'MT Nusantara Tanker I',
        code: 'VSL-NT-02',
        vesselType: 'Tanker',
        flag: 'Indonesia',
        imoNumber: 'IMO 9745120',
        capacityDwt: 45000,
        capacityTeu: 0,
        yearBuilt: 2021,
        status: 'Siap Muat',
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
        lengthMeters: 210,
        beamMeters: 35,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'vessel-03',
        name: 'MV Celebes Bulk Express',
        code: 'VSL-CB-03',
        vesselType: 'Bulk Carrier',
        flag: 'Indonesia',
        imoNumber: 'IMO 9612300',
        capacityDwt: 52000,
        capacityTeu: 0,
        yearBuilt: 2018,
        status: 'Sandar/Dermaga',
        imageUrl: 'https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&w=800&q=80',
        lengthMeters: 225,
        beamMeters: 38,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'vessel-04',
        name: 'TB Barito 08 & TK Kalimantan 302',
        code: 'VSL-TB-04',
        vesselType: 'Tugboat & Barge',
        flag: 'Indonesia',
        imoNumber: 'IMO 9521199',
        capacityDwt: 8000,
        capacityTeu: 0,
        yearBuilt: 2022,
        status: 'Berlayar',
        imageUrl: 'https://images.unsplash.com/photo-1505705694340-019e1e335916?auto=format&fit=crop&w=800&q=80',
        lengthMeters: 90,
        beamMeters: 22,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'vessel-05',
        name: 'KM Java Express Ro-Ro',
        code: 'VSL-JE-05',
        vesselType: 'Ro-Ro / Passenger',
        flag: 'Indonesia',
        imoNumber: 'IMO 9400234',
        capacityDwt: 12000,
        capacityTeu: 350,
        yearBuilt: 2020,
        status: 'Maintenance/Dok',
        imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
        lengthMeters: 145,
        beamMeters: 26,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const v of vessels) {
      await setDoc(doc(db, 'vessels', v.id), v);
    }

    // 2. Seed Ports
    const ports: Port[] = [
      {
        id: 'port-jkt',
        code: 'IDJKT',
        name: 'Pelabuhan Tanjung Priok',
        city: 'Jakarta Utara',
        province: 'DKI Jakarta',
        country: 'Indonesia',
        dockType: 'Dermaga Petikemas & Curah',
        draftDepthMeters: 14.5,
        berthFeePerDay: 45000000,
        status: 'Aktif',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'port-sub',
        code: 'IDSUB',
        name: 'Pelabuhan Tanjung Perak',
        city: 'Surabaya',
        province: 'Jawa Timur',
        country: 'Indonesia',
        dockType: 'Dermaga Multipurpose',
        draftDepthMeters: 13.0,
        berthFeePerDay: 38000000,
        status: 'Aktif',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'port-bpn',
        code: 'IDBPN',
        name: 'Pelabuhan Semayang Balikpapan',
        city: 'Balikpapan',
        province: 'Kalimantan Timur',
        country: 'Indonesia',
        dockType: 'Dermaga Tanker & General Cargo',
        draftDepthMeters: 12.5,
        berthFeePerDay: 32000000,
        status: 'Aktif',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'port-mak',
        code: 'IDMAK',
        name: 'Pelabuhan Soekarno-Hatta Makassar',
        city: 'Makassar',
        province: 'Sulawesi Selatan',
        country: 'Indonesia',
        dockType: 'Dermaga Petikemas & Ro-Ro',
        draftDepthMeters: 12.0,
        berthFeePerDay: 30000000,
        status: 'Aktif',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'port-mes',
        code: 'IDMES',
        name: 'Pelabuhan Belawan',
        city: 'Medan',
        province: 'Sumatera Utara',
        country: 'Indonesia',
        dockType: 'Dermaga Curah Cair & Petikemas',
        draftDepthMeters: 11.5,
        berthFeePerDay: 28000000,
        status: 'Aktif',
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const p of ports) {
      await setDoc(doc(db, 'ports', p.id), p);
    }

    // 3. Seed Cargos
    const cargos: Cargo[] = [
      {
        id: 'cargo-ct20',
        code: 'CRG-CT20',
        name: 'Petikemas Standard 20 Feet Dry Box',
        category: 'Container 20ft',
        unit: 'TEU',
        baseTariffPerUnit: 14500000,
        description: 'Kontainer kering ukuran 20 feet standar ISO',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cargo-ct40',
        code: 'CRG-CT40',
        name: 'Petikemas Standard 40 Feet High Cube',
        category: 'Container 40ft',
        unit: 'TEU',
        baseTariffPerUnit: 26000000,
        description: 'Kontainer kering ukuran 40 feet ISO High Cube',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cargo-cpo',
        code: 'CRG-CPO',
        name: 'Minyak Kelapa Sawit (Crude Palm Oil / CPO)',
        category: 'Liquid Bulk',
        unit: 'KL',
        baseTariffPerUnit: 350000,
        description: 'Muatan curah cair CPO tangki terisolasi',
        hazardClass: 'Non-Hazardous Liquid',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cargo-coal',
        code: 'CRG-COAL',
        name: 'Batu Bara Bituminous (Thermal Coal)',
        category: 'Dry Bulk',
        unit: 'Ton',
        baseTariffPerUnit: 180000,
        description: 'Muatan curah kering batu bara kalori menengah',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cargo-dg',
        code: 'CRG-DG03',
        name: 'Bahan Kimia Industri Class 3 Flammable',
        category: 'Dangerous Goods',
        unit: 'M3',
        baseTariffPerUnit: 850000,
        description: 'Barang berbahaya kategori IMO Class 3 dengan sertifikat IMDG',
        hazardClass: 'IMO Class 3 Flammable Liquid',
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const c of cargos) {
      await setDoc(doc(db, 'cargos', c.id), c);
    }

    // 4. Seed Crew
    const crews: Crew[] = [
      {
        id: 'crew-01',
        nik: 'CRW-31710012',
        name: 'Capt. Bambang Soetjipto, M.Mar',
        role: 'Kapten / Nakhoda',
        assignedVesselId: 'vessel-01',
        assignedVesselName: 'MV Samudra Nusantara',
        certification: 'ANT-I (Ahli Nautika Tingkat I) & GMDSS',
        phone: '0812-9876-5432',
        email: 'bambang.capt@samudra-maritime.co.id',
        status: 'Aktif',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'crew-02',
        nik: 'CRW-31710015',
        name: 'Irfan Hakim, S.ST.Pel',
        role: 'Mualim I',
        assignedVesselId: 'vessel-01',
        assignedVesselName: 'MV Samudra Nusantara',
        certification: 'ANT-II & ARPA Radar Simulator',
        phone: '0813-1122-3344',
        email: 'irfan.mualim@samudra-maritime.co.id',
        status: 'Aktif',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'crew-03',
        nik: 'CRW-31710020',
        name: 'Hendra Kurniawan, M.Mar.E',
        role: 'KKM / Chief Engineer',
        assignedVesselId: 'vessel-02',
        assignedVesselName: 'MT Nusantara Tanker I',
        certification: 'ATT-I (Ahli Teknika Tingkat I)',
        phone: '0815-5544-3322',
        email: 'hendra.kkm@samudra-maritime.co.id',
        status: 'Aktif',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'crew-04',
        nik: 'CRW-31710028',
        name: 'Dimas Anggara',
        role: 'Masinis II',
        assignedVesselId: 'vessel-02',
        assignedVesselName: 'MT Nusantara Tanker I',
        certification: 'ATT-III & Advanced Fire Fighting',
        phone: '0818-8877-6655',
        email: 'dimas.masinis@samudra-maritime.co.id',
        status: 'Aktif',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'crew-05',
        nik: 'CRW-31710035',
        name: 'Aris Munandar',
        role: 'Kelasi / AB',
        assignedVesselId: 'vessel-03',
        assignedVesselName: 'MV Celebes Bulk Express',
        certification: 'BST & Security Awareness Training',
        phone: '0821-3333-4444',
        email: 'aris.ab@samudra-maritime.co.id',
        status: 'Cuti',
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const cr of crews) {
      await setDoc(doc(db, 'crew', cr.id), cr);
    }

    // 5. Seed Customers
    const customers: Customer[] = [
      {
        id: 'cust-01',
        code: 'CST-SLI-01',
        companyName: 'PT Samudra Logistik Indonesia',
        contactPerson: 'Bpk. Budi Santoso',
        email: 'budi.s@samudralogistik.co.id',
        phone: '021-5588990',
        address: 'Jl. Yos Sudarso No. 45, Tanjung Priok, Jakarta Utara',
        category: 'Freight Forwarder',
        creditLimit: 2500000000,
        status: 'Aktif',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cust-02',
        code: 'CST-ISM-02',
        companyName: 'PT Indofood Sukses Makmur Tbk',
        contactPerson: 'Ibu Ratna Pertiwi',
        email: 'ratna.p@indofood.co.id',
        phone: '021-5795888',
        address: 'Indofood Tower Lt. 23, Jl. Jend. Sudirman, Jakarta Pusat',
        category: 'Corporate',
        creditLimit: 5000000000,
        status: 'Aktif',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cust-03',
        code: 'CST-PPN-03',
        companyName: 'PT Pertamina Patra Niaga',
        contactPerson: 'Bpk. Agus Hermawan',
        email: 'agus.h@pertaminapatraniaga.com',
        phone: '021-31900000',
        address: 'Gedung Wisma Tugu, Jl. Rasuna Said, Jakarta Selatan',
        category: 'Corporate',
        creditLimit: 10000000000,
        status: 'Aktif',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cust-04',
        code: 'CST-PKT-04',
        companyName: 'PT Pupuk Kalimantan Timur',
        contactPerson: 'Bpk. Dedi Supriyadi',
        email: 'dedi.s@pupukkaltim.com',
        phone: '0548-21000',
        address: 'Jl. James Simandjuntak No. 1, Bontang, Kalimantan Timur',
        category: 'Shipper',
        creditLimit: 3000000000,
        status: 'Aktif',
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const cust of customers) {
      await setDoc(doc(db, 'customers', cust.id), cust);
    }

    // 6. Seed Voyages
    const voyages: Voyage[] = [
      {
        id: 'vyg-01',
        voyageNumber: 'VYG-2026-001',
        vesselId: 'vessel-01',
        vesselName: 'MV Samudra Nusantara',
        originPortId: 'port-jkt',
        originPortName: 'Pelabuhan Tanjung Priok (Jakarta)',
        destinationPortId: 'port-sub',
        destinationPortName: 'Pelabuhan Tanjung Perak (Surabaya)',
        etd: '2026-10-06T08:00:00Z',
        eta: '2026-10-08T14:00:00Z',
        captainName: 'Capt. Bambang Soetjipto, M.Mar',
        status: 'In Transit',
        notes: 'Pelayaran rute Tol Laut Jawa regular batch #42',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'vyg-02',
        voyageNumber: 'VYG-2026-002',
        vesselId: 'vessel-02',
        vesselName: 'MT Nusantara Tanker I',
        originPortId: 'port-bpn',
        originPortName: 'Pelabuhan Semayang Balikpapan',
        destinationPortId: 'port-mes',
        destinationPortName: 'Pelabuhan Belawan (Medan)',
        etd: '2026-10-09T10:00:00Z',
        eta: '2026-10-14T18:00:00Z',
        captainName: 'Capt. Hendra Kurniawan, M.Mar.E',
        status: 'Loading',
        notes: 'Pengangkutan curah CPO pasokan pabrik Medan',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'vyg-03',
        voyageNumber: 'VYG-2026-003',
        vesselId: 'vessel-03',
        vesselName: 'MV Celebes Bulk Express',
        originPortId: 'port-sub',
        originPortName: 'Pelabuhan Tanjung Perak (Surabaya)',
        destinationPortId: 'port-mak',
        destinationPortName: 'Pelabuhan Soekarno-Hatta Makassar',
        etd: '2026-10-12T06:00:00Z',
        eta: '2026-10-15T12:00:00Z',
        captainName: 'Capt. Suryadi, M.Mar',
        status: 'Scheduled',
        notes: 'Rute pengiriman batu bara & bahan konstruksi',
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const vyg of voyages) {
      await setDoc(doc(db, 'voyages', vyg.id), vyg);
    }

    // 7. Seed Bookings
    const bookings: Booking[] = [
      {
        id: 'bko-01',
        bookingNumber: 'BKO-2026-801',
        bookingDate: '2026-10-01',
        customerId: 'cust-01',
        customerName: 'PT Samudra Logistik Indonesia',
        voyageId: 'vyg-01',
        voyageNumber: 'VYG-2026-001',
        cargoId: 'cargo-ct20',
        cargoName: 'Petikemas Standard 20 Feet Dry Box',
        quantity: 25,
        unit: 'TEU',
        originPortName: 'Pelabuhan Tanjung Priok (Jakarta)',
        destinationPortName: 'Pelabuhan Tanjung Perak (Surabaya)',
        totalPrice: 362500000,
        status: 'On Board',
        notes: '25 Unit Container 20ft isi barang elektronik & logistik',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'bko-02',
        bookingNumber: 'BKO-2026-802',
        bookingDate: '2026-10-02',
        customerId: 'cust-03',
        customerName: 'PT Pertamina Patra Niaga',
        voyageId: 'vyg-02',
        voyageNumber: 'VYG-2026-002',
        cargoId: 'cargo-cpo',
        cargoName: 'Minyak Kelapa Sawit (Crude Palm Oil / CPO)',
        quantity: 1200,
        unit: 'KL',
        originPortName: 'Pelabuhan Semayang Balikpapan',
        destinationPortName: 'Pelabuhan Belawan (Medan)',
        totalPrice: 420000000,
        status: 'Confirmed',
        notes: 'Pengisian via pipa otomatis terminal Balikpapan',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'bko-03',
        bookingNumber: 'BKO-2026-803',
        bookingDate: '2026-10-04',
        customerId: 'cust-02',
        customerName: 'PT Indofood Sukses Makmur Tbk',
        voyageId: 'vyg-01',
        voyageNumber: 'VYG-2026-001',
        cargoId: 'cargo-ct40',
        cargoName: 'Petikemas Standard 40 Feet High Cube',
        quantity: 10,
        unit: 'TEU',
        originPortName: 'Pelabuhan Tanjung Priok (Jakarta)',
        destinationPortName: 'Pelabuhan Tanjung Perak (Surabaya)',
        totalPrice: 260000000,
        status: 'On Board',
        notes: 'Produk makanan konsumsi kemasan box',
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const bko of bookings) {
      await setDoc(doc(db, 'bookings', bko.id), bko);
    }

    // 8. Seed Manifests
    const manifests: Manifest[] = [
      {
        id: 'mnf-01',
        manifestNumber: 'MNF-2026-101',
        voyageId: 'vyg-01',
        voyageNumber: 'VYG-2026-001',
        containerOrSealNo: 'TGHU-209182 / SEAL-88120',
        shipperName: 'PT Samudra Logistik Indonesia',
        consigneeName: 'PT Mitra Surabaya Jaya',
        description: 'Peralatan Elektronik & Spareparts Komputer',
        weightKg: 18500,
        volumeM3: 33.2,
        bayLocation: 'Bay 04 / Row 02 / Tier 82',
        status: 'In Transit',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'mnf-02',
        manifestNumber: 'MNF-2026-102',
        voyageId: 'vyg-01',
        voyageNumber: 'VYG-2026-001',
        containerOrSealNo: 'INDF-409112 / SEAL-99012',
        shipperName: 'PT Indofood Sukses Makmur Tbk',
        consigneeName: 'CV Distributor Indo East Surabaya',
        description: 'Produk Biskuit & Mie Instan Kemasan Kardus',
        weightKg: 22000,
        volumeM3: 68.0,
        bayLocation: 'Bay 12 / Row 04 / Tier 84',
        status: 'In Transit',
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const mnf of manifests) {
      await setDoc(doc(db, 'manifests', mnf.id), mnf);
    }

    // 9. Seed Invoices
    const invoices: Invoice[] = [
      {
        id: 'inv-01',
        invoiceNumber: 'INV-2026-001',
        bookingId: 'bko-01',
        bookingNumber: 'BKO-2026-801',
        customerId: 'cust-01',
        customerName: 'PT Samudra Logistik Indonesia',
        issueDate: '2026-10-02',
        dueDate: '2026-10-16',
        freightCharge: 362500000,
        handlingFee: 15000000,
        portFee: 8500000,
        taxAmount: 42460000, // 11% PPN
        totalAmount: 428460000,
        status: 'Belum Lunas',
        paymentMethod: 'Transfer Bank Mandiri Virtual Account',
        notes: 'Term pembayaran 14 hari kalender',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'inv-02',
        invoiceNumber: 'INV-2026-002',
        bookingId: 'bko-02',
        bookingNumber: 'BKO-2026-802',
        customerId: 'cust-03',
        customerName: 'PT Pertamina Patra Niaga',
        issueDate: '2026-10-03',
        dueDate: '2026-10-17',
        freightCharge: 420000000,
        handlingFee: 18000000,
        portFee: 12000000,
        taxAmount: 49500000,
        totalAmount: 499500000,
        status: 'Lunas',
        paymentMethod: 'Transfer BCA Corporate',
        notes: 'Lunas dibayar tgl 04 Oct 2026',
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const inv of invoices) {
      await setDoc(doc(db, 'invoices', inv.id), inv);
    }

    console.log('Maritime initial database seeded successfully!');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'vessels/ports/cargos');
  }
}
