import { Router } from 'express';
import { getRooms, createRoom, toggleJoin, deleteRoom } from '../controllers/roomController.js';
import { protect, validateObjectId } from '../middlewares/auth.js';
import { validate, createRoomSchema } from '../validators/index.js';

const router = Router();
router.use(protect);
router.param('id', validateObjectId);

router.get('/', getRooms);
router.post('/', validate(createRoomSchema), createRoom);
router.put('/:id/join', toggleJoin);
router.delete('/:id', deleteRoom);

export default router;
