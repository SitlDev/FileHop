import { Router } from 'express';
import * as P from '../lib/printify.js';
import { CATALOG } from '../lib/catalog.js';

export const printifyRouter = Router();

// Local catalog (for storefront display)
printifyRouter.get('/catalog', (req, res) => {
  res.json(Object.entries(CATALOG).map(([id, p]) => ({
    id: Number(id), slogan: p.slogan, tagline: p.tagline, description: p.description,
    price: p.price, accent: p.accent, sizes: Object.keys(p.variants),
  })));
});

// Products
printifyRouter.get('/products', async (req, res, next) => { try { res.json(await P.listProducts()); } catch (e) { next(e); } });
printifyRouter.get('/products/:id', async (req, res, next) => { try { res.json(await P.getProduct(req.params.id)); } catch (e) { next(e); } });
printifyRouter.post('/products', async (req, res, next) => { try { res.json(await P.createProduct(req.body)); } catch (e) { next(e); } });
printifyRouter.put('/products/:id', async (req, res, next) => { try { res.json(await P.updateProduct(req.params.id, req.body)); } catch (e) { next(e); } });
printifyRouter.post('/products/:id/publish', async (req, res, next) => { try { res.json(await P.publishProduct(req.params.id)); } catch (e) { next(e); } });

// Blueprints
printifyRouter.get('/blueprints', async (req, res, next) => { try { res.json(await P.listBlueprints()); } catch (e) { next(e); } });
printifyRouter.get('/blueprints/:bpId/providers', async (req, res, next) => { try { res.json(await P.getBlueprintProviders(req.params.bpId)); } catch (e) { next(e); } });
printifyRouter.get('/blueprints/:bpId/providers/:pvId/variants', async (req, res, next) => { try { res.json(await P.getBlueprintVariants(req.params.bpId, req.params.pvId)); } catch (e) { next(e); } });

// Uploads
printifyRouter.post('/uploads', async (req, res, next) => {
  try {
    const { fileName, url, contents } = req.body;
    res.json(url ? await P.uploadImageByUrl(fileName, url) : await P.uploadImageBase64(fileName, contents));
  } catch (e) { next(e); }
});

// Shipping calc
printifyRouter.post('/shipping', async (req, res, next) => {
  try { res.json(await P.calculateShipping(req.body.addressTo, req.body.lineItems)); } catch (e) { next(e); }
});
