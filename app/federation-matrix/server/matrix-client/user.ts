import { MatrixProfileInfo } from 'matrix-bot-sdk';

import { IUser } from '../../../../definition/IUser';
import { matrixBridge } from '../bridge';
import { MatrixBridgedUser, MatrixBridgedRoom, Users } from '../../../models/server';
import { config } from '../config';
import { matrixClient } from '.';
import { dataInterface } from '../data-interface';

interface ICreateUserResult {
	uid: string;
	mui: string;
	remote: boolean;
}

export const invite = async (inviterId: string, roomId: string, invitedId: string): Promise<void> => {
	console.log(`[${inviterId}-${invitedId}-${roomId}] Inviting user ${invitedId} to ${roomId}...`);

	// Find the bridged room id
	let matrixRoomId = await MatrixBridgedRoom.getMatrixId(roomId);

	if (!matrixRoomId) {
		console.log(`[${inviterId}-${invitedId}-${roomId}] Creating remote room...`);

		// Get the room
		const room = await dataInterface.room(roomId);

		// Create the missing room
		const { mri } = await matrixClient.room.create({ _id: inviterId } as IUser, room);

		matrixRoomId = mri;

		console.log(`[${inviterId}-${invitedId}-${roomId}] Remote room created as ${matrixRoomId}...`);
	}

	// Find the inviter user
	let inviterUser = MatrixBridgedUser.getById(inviterId);

	if (!inviterUser) {
		console.log(`[${inviterId}-${invitedId}-${roomId}] Creating remote inviter user...`);

		// Get the user
		const user = await dataInterface.user(inviterId);

		// Create the missing user
		inviterUser = await matrixClient.user.createRemote(user);

		console.log(`[${inviterId}-${invitedId}-${roomId}] Inviter user created as ${inviterUser.mui}...`);
	}

	// Determine if the user is local or remote
	let invitedUserMatrixId = invitedId;
	const invitedUserDomain = invitedId.includes(':') ? invitedId.split(':').pop() : '';
	const invitedUserIsRemote = invitedUserDomain && invitedUserDomain !== config.serverDomain;

	console.log(invitedUserMatrixId, invitedUserDomain, invitedUserIsRemote);

	// If the invited user is not remote, let's ensure it exists remotely
	if (!invitedUserIsRemote) {
		console.log(`[${inviterId}-${invitedId}-${roomId}] Creating remote invited user...`);

		// Find the invited user
		const invitedUser = Users.findOneByUsername(invitedId.replace('@', ''));

		// Check if we already have a matrix id for that user
		const existingMatrixId = MatrixBridgedUser.getMatrixId(invitedUser._id);

		if (!existingMatrixId) {
			const { mui } = await matrixClient.user.createRemote(invitedUser);

			invitedUserMatrixId = mui;
		} else {
			invitedUserMatrixId = existingMatrixId;
		}

		console.log(`[${inviterId}-${invitedId}-${roomId}] Invited user created as ${invitedUserMatrixId}...`);
	}

	console.log(`[${inviterId}-${invitedId}-${roomId}] Inviting the user...`);

	// Invite the user
	await matrixBridge.getIntent(inviterUser.mui).invite(matrixRoomId, invitedUserMatrixId);

	// Auto-join if the user is Rocket.Chat controlled
	if (!invitedUserIsRemote) {
		console.log(`[${inviterId}-${invitedId}-${roomId}] Auto-join room...`);

		await matrixBridge.getIntent(invitedUserMatrixId).join(matrixRoomId);
	}
};

export const createRemote = async (u: IUser): Promise<ICreateUserResult> => {
	const matrixUserId = `@${u.username?.toLowerCase()}:${config.serverDomain}`;

	console.log(`Creating remote user ${matrixUserId}...`);

	const intent = matrixBridge.getIntent(matrixUserId);

	await intent.ensureProfile(u.name);

	await intent.setDisplayName(`${u.username} (${u.name})`);

	const payload = { uid: u._id, mui: matrixUserId, remote: true };

	MatrixBridgedUser.upsert({ uid: u._id }, payload);

	return payload;
};

export const createLocal = async (matrixUserId: string): Promise<ICreateUserResult> => {
	console.log(`Creating local user ${matrixUserId}...`);

	const intent = matrixBridge.getIntent(matrixUserId);

	let currentProfile: MatrixProfileInfo = {};

	try {
		currentProfile = await intent.getProfileInfo(matrixUserId);
	} catch (err) {
		// no-op
	}

	const uid = Users.create({
		username: matrixUserId.replace('@', ''),
		type: 'user',
		status: 'online',
		active: true,
		roles: ['user'],
		name: currentProfile.displayname,
		requirePasswordChange: false,
	});

	const payload = { uid, mui: matrixUserId, remote: false };

	MatrixBridgedUser.upsert({ uid }, payload);

	return payload;
};