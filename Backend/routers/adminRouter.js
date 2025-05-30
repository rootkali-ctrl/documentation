const Router=require("express").Router();
const upload = require("multer")();

const {
    acceptRegistrationRequest,
    rejectRegistrationRequest,
    getAllRegistrationRequests,
    getRequestDetails,
    getVendorStatus,
    removeVendor,
    addBanner,
    saveBannerUrls,
    getRecentBanners,
    deleteBanner,
    addBannerInline,
    getRecentBannersInline,
    deleteBannerInline,
    saveBannerUrlsInline
}=require("../controllers/adminController");

Router.put('/requests',acceptRegistrationRequest);
Router.delete('/rejectvendor',rejectRegistrationRequest);
Router.delete("/removevendor", removeVendor);
Router.get('/allrequests',getAllRegistrationRequests);
Router.get('/request/:requestid',getRequestDetails);
Router.get('/getVendorStatus', getVendorStatus);
Router.post("/add-banner", upload.array("bannerImages", 4), addBanner);
Router.post("/save-banner-urls", saveBannerUrls);
Router.get("/banners/recent", getRecentBanners);
Router.post("/banners/delete", deleteBanner)
Router.post("/add-banner-inline",upload.array("bannerImages",1),addBannerInline)
Router.get("/banners/recent-inline", getRecentBannersInline);
Router.post("/banners-delete-inline", deleteBannerInline);
Router.post("/save-banner-urls-inline", saveBannerUrlsInline);

module.exports=Router;