const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');

class BaseScraper {
  constructor(sourceName) {
    this.sourceName = sourceName;
    this.prisma = new PrismaClient();
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log(`◈ INITIALIZING SCRAPER: ${this.sourceName}...`);
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
  }

  async close() {
    console.log(`◈ CLOSING SCRAPER: ${this.sourceName}...`);
    if (this.browser) await this.browser.close();
    await this.prisma.$disconnect();
  }

  // To be implemented by subclasses
  async scrape() {
    throw new Error('scrape() must be implemented');
  }

  async saveListing(data) {
    console.log(`◈ SAVING SIGNAL: ${data.title}...`);
    try {
      // Extract parcel data from listing
      const parcelData = {
        assessedValue: data.assessedValue || data.price * 1.1,
        landValue: data.landValue || data.price * 0.7,
        improvementValue: data.improvementValue || data.price * 0.3,
        lastSalePrice: data.lastSalePrice || data.price,
        lastSaleDate: data.lastSaleDate || new Date(),
        ownershipYears: data.ownershipYears || Math.random() * 30,
        priorTaxSales: data.priorTaxSales || 0,
        zoning: data.zoning || 'Commercial',
        encumbrances: data.encumbrances || [],
        taxDelinquentYears: data.taxDelinquentYears || 0,
      };

      // Remove parcel fields from listing data
      const { assessedValue, landValue, improvementValue, lastSalePrice, lastSaleDate, ownershipYears, priorTaxSales, zoning, encumbrances, taxDelinquentYears, ...listingData } = data;

      // Check if listing already exists
      const existingListing = await this.prisma.listing.findUnique({
        where: { title: data.title },
        include: { parcel: true }
      });

      if (existingListing && existingListing.parcelId) {
        // Update existing parcel and listing
        await this.prisma.parcel.update({
          where: { id: existingListing.parcelId },
          data: parcelData
        });
        return await this.prisma.listing.update({
          where: { title: data.title },
          data: listingData
        });
      } else {
        // Create new parcel and listing
        const parcel = await this.prisma.parcel.create({
          data: parcelData
        });
        return await this.prisma.listing.upsert({
          where: { title: data.title },
          update: { ...listingData, parcelId: parcel.id },
          create: { ...listingData, parcelId: parcel.id }
        });
      }
    } catch (error) {
      console.error(`◈ FAILED TO SAVE: ${data.title}`, error);
    }
  }

  async updateJobStatus(status, found = 0, errors = 0) {
    console.log(`◈ JOB STATUS: ${status} | FOUND: ${found} | ERRORS: ${errors}`);
    // Logic to update a ScrapeJob table if we add one later
  }
}

module.exports = BaseScraper;
