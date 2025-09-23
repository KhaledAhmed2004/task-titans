// src/modules/banner/banner.controller.ts
export const BannerController = {
  async create(req: Request, res: Response) {
    try {
      const created = await BannerService.createBanner(req.body);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      console.error('create banner error', err);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const { active } = req.query as any;
      const filter: any = {};
      if (active === 'true') filter.isActive = true;
      if (active === 'false') filter.isActive = false;

      const banners = await BannerService.getBanners(filter);
      return res.json({ success: true, data: banners });
    } catch (err) {
      console.error('list banners error', err);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const banner = await BannerService.getBannerById(id);
      if (!banner)
        return res
          .status(404)
          .json({ success: false, message: 'Banner not found' });
      return res.json({ success: true, data: banner });
    } catch (err) {
      console.error('get banner error', err);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await BannerService.updateBanner(id, req.body);
      if (!updated)
        return res
          .status(404)
          .json({ success: false, message: 'Banner not found or invalid id' });
      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error('update banner error', err);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await BannerService.deleteBanner(id);
      if (!deleted)
        return res
          .status(404)
          .json({ success: false, message: 'Banner not found or invalid id' });
      return res.json({ success: true, message: 'Banner deleted' });
    } catch (err) {
      console.error('delete banner error', err);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },
};
