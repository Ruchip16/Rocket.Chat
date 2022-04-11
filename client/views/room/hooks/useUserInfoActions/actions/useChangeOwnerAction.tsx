import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { useMemo } from 'react';

import { IRoom } from '../../../../../../definition/IRoom';
import { IUser } from '../../../../../../definition/IUser';
import { usePermission } from '../../../../../contexts/AuthorizationContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useEndpointActionExperimental } from '../../../../../hooks/useEndpointActionExperimental';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import { Action } from '../../../../hooks/useActionSpread';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import { useUserHasRoomRole } from '../../useUserHasRoomRole';

// TODO: add return type
export const useChangeOwnerAction = (room: IRoom, user: Pick<IUser, '_id' | 'username'>): Action => {
	const t = useTranslation();
	const rid = room._id;
	const { _id: uid } = user;
	const userCanSetOwner = usePermission('set-owner', rid);
	const isOwner = useUserHasRoomRole(uid, rid, 'owner');
	const endpointPrefix = room.t === 'p' ? 'groups' : 'channels';

	const [roomCanSetOwner] = getRoomDirectives(room);
	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));

	const changeOwnerEndpoint = isOwner ? 'removeOwner' : 'addOwner';
	const changeOwnerMessage = isOwner ? 'User__username__removed_from__room_name__owners' : 'User__username__is_now_a_owner_of__room_name_';

	const changeOwner = useEndpointActionExperimental(
		'POST',
		`${endpointPrefix}.${changeOwnerEndpoint}`,
		// eslint-disable-next-line @typescript-eslint/camelcase
		t(changeOwnerMessage, { username: user.username, room_name: roomName }),
	);

	const changeOwnerAction = useMutableCallback(async () => changeOwner({ roomId: rid, userId: uid }));
	const changeOwnerOption = useMemo(
		() =>
			roomCanSetOwner &&
			userCanSetOwner && {
				label: t(isOwner ? 'Remove_as_owner' : 'Set_as_owner'),
				icon: 'shield-check',
				action: changeOwnerAction,
				checkOption: true,
				isChecked: isOwner,
			},
		[changeOwnerAction, roomCanSetOwner, userCanSetOwner, isOwner, t],
	);

	return changeOwnerOption;
};
