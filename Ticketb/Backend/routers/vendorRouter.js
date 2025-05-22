const upload=require('multer')();
const {
  addvendor,
  loginvendor,
  addOrganizationDetails,
  addDocuments,
  getAllEventStatistics,
  getEventStatistics,
  getVendorById,
    checkVendorEmail

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


module.exports=router


// router.post('/signin', upload.fields([
//   { name: 'panUpload', maxCount: 1 },
//   { name: 'aadharUpload', maxCount: 1 },
//   { name: 'bankUpload', maxCount: 1 }
// ]), addvendor);