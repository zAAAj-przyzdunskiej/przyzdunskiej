-- CreateEnum
CREATE TYPE "Rights" AS ENUM ('X', 'WE', 'IB', 'AZ', 'IN', 'WP', 'ZK', 'PO', 'IW');

-- CreateEnum
CREATE TYPE "Country" AS ENUM ('AF', 'DAX', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO', 'BQ', 'BA', 'BW', 'BV', 'BR', 'IO', 'BN', 'BG', 'BF', 'BI', 'CV', 'KH', 'CM', 'CA', 'KY', 'CF', 'TD', 'CL', 'CN', 'CX', 'CC', 'CO', 'KM', 'CG', 'CD', 'CK', 'CR', 'CI', 'HR', 'CU', 'CW', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FK', 'FO', 'FJ', 'FI', 'FR', 'GF', 'PF', 'TF', 'GA', 'GM', 'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW', 'GY', 'HT', 'HM', 'VA', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IM', 'IL', 'IT', 'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MO', 'MK', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MS', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI', 'NE', 'NG', 'NU', 'NF', 'KP', 'MP', 'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PN', 'PL', 'PT', 'PR', 'QA', 'RE', 'RO', 'RU', 'RW', 'BL', 'SH', 'KN', 'LC', 'MF', 'PM', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SX', 'SK', 'SI', 'SB', 'SO', 'ZA', 'GS', 'KR', 'SS', 'ES', 'LK', 'SD', 'SR', 'SJ', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TK', 'TO', 'TT', 'TN', 'TR', 'TM', 'TC', 'TV', 'UG', 'UA', 'AE', 'GB', 'UM', 'US', 'UY', 'UZ', 'VU', 'VE', 'VN', 'VG', 'VI', 'WF', 'EH', 'YE', 'ZM', 'ZW');

-- CreateEnum
CREATE TYPE "IndentityType" AS ENUM ('passport', 'residence_card', 'id_card', 'ekuz', 'foreign_national_id', 'foreign_driver_license', 'others', 'none', 'nn', 'nw');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOCTOR', 'PATIENT', 'RECEPTIONIST');

-- CreateTable
CREATE TABLE "Address" (
    "id" INTEGER NOT NULL,
    "country" "Country" NOT NULL DEFAULT 'PL',
    "street" TEXT,
    "street_number" TEXT,
    "flat_number" TEXT,
    "postal_code" TEXT,
    "city" TEXT,
    "province" TEXT,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "pesel" VARCHAR(12) NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "id" INTEGER,
    "name" TEXT,
    "surname" TEXT,
    "second_telephone" TEXT,
    "date_of_birth" TEXT,
    "sex" VARCHAR(12),
    "identity_type" "IndentityType",
    "identity_num" VARCHAR(80),
    "country" "Country" DEFAULT 'PL',
    "supervisor" INTEGER,
    "nfz" VARCHAR(2) DEFAULT 'X',
    "rights" "Rights" DEFAULT 'X',
    "second_name" TEXT,
    "maiden_name" TEXT,
    "place_of_birth" TEXT,
    "internal_card_id" TEXT,
    "blood_type" TEXT,
    "teryt" INTEGER,
    "active" BOOLEAN DEFAULT false,
    "zipcode" VARCHAR(10) NOT NULL,
    "password" VARCHAR(128),
    "role" "Role"[] DEFAULT ARRAY['PATIENT']::"Role"[],
    "photo" TEXT,
    "registration_address_id" INTEGER,
    "residence_address_id" INTEGER,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("pesel")
);

-- CreateIndex
CREATE UNIQUE INDEX "Address_id_key" ON "Address"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_pesel_key" ON "User"("pesel");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_registration_address_id_fkey" FOREIGN KEY ("registration_address_id") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_residence_address_id_fkey" FOREIGN KEY ("residence_address_id") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User" ADD COLUMN mydr2id INTEGER;

ALTER TABLE "User" ADD COLUMN "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;