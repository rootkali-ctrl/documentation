const upload=require('multer')();
const {
  addvendor,
  loginvendor,
  addOrganizationDetails,
  addDocuments,
  getAllEventStatistics,
  getEventStatistics,
  getVendorById,
    checkVendorEmail,
    vendorGetWithPass,
    vendorUpdateDetails,
    lastlogin,
    fetchLastLogin

}=require('../controllers/vendorController')
const router=require("express").Router();

router.post(
  '/signin',
  upload.fields([
    { name: 'panUpload', maxCount: 1 },
    { name: 'aadharUpload', maxCount: 1 },
    { name: 'bankUpload', maxCount: 1 }
  ]),
  addvendor
);
router.post('/login',loginvendor);
router.post('/organisation_details',addOrganizationDetails);
router.post('/documents',upload.fields([
  { name: 'panUpload', maxCount: 1 },
  { name: 'aadharUpload', maxCount: 1 },
  { name: 'bankUpload', maxCount: 1 }
]),addDocuments);
router.get('/allEventStatistics',getAllEventStatistics);
router.get('/eventStatistics/:eventId',getEventStatistics);
router.get('/check-email', checkVendorEmail);
router.get('/exists/:email', checkVendorEmail);
router.get('/:vendorId', getVendorById);
router.get('/vendorupdate/:vendorId', vendorGetWithPass);
router.put('/update/:vendorId', vendorUpdateDetails);

router.post("/lastlogin", lastlogin)
router.get("/vendorLastLogin/:vendorId", fetchLastLogin)
module.exports=router


// router.post('/signin', upload.fields([
//   { name: 'panUpload', maxCount: 1 },
//   { name: 'aadharUpload', maxCount: 1 },
//   { name: 'bankUpload', maxCount: 1 }
// ]), addvendor);