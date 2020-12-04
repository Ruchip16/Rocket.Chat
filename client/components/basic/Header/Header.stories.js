import React, { lazy } from 'react';

import { SettingsContext } from '../../../contexts/SettingsContext';
import Header from './Header';
import RoomAvatar from '../avatar/RoomAvatar';
import { useRoomIcon } from '../../../hooks/useRoomIcon';
import ToolBox from '../../../views/room/Header/ToolBox';
import { ToolboxProvider } from '../../../views/room/providers/ToolboxProvider';
import { addAction } from '../../../channel/lib/Toolbox';

export default {
	title: 'Chat Header',
	component: Header,
};

const room = {
	t: 'c',
	name: 'general general general general general general general general general general general general general general general general general general general',
	_id: 'GENERAL',
	encrypted: true,
	autoTranslate: true,
	autoTranslateLanguage: 'pt-BR',
};

const settings = {
	Favorite_Rooms: true,
	AutoTranslate_Enabled: true,
	E2E_Enable: true,
};


const settingContextValue = {
	hasPrivateAccess: true,
	isLoading: false,
	querySetting: (setting) => ({
		getCurrentValue: () => settings[setting],
		subscribe: () => () => undefined,
	}),
	querySettings: () => ({
		getCurrentValue: () => [],
		subscribe: () => () => undefined,
	}),
	dispatch: async () => undefined,
};

export const ChatHeader = () => {
	const icon = useRoomIcon(room);
	const avatar = <RoomAvatar room={room}/>;
	return <SettingsContext.Provider value={settingContextValue}>
		<Header>
			<Header.Avatar>{avatar}</Header.Avatar>
			<Header.Content>
				<Header.Content.Row>
					{ icon && <Header.Icon icon={icon}/> }
					<Header.Title>{room.name}</Header.Title>
					<Header.State onClick icon='star'/>
					<Header.State icon='key'/>
					<Header.State icon='language'/>
				</Header.Content.Row>
				<Header.Content.Row>
					<Header.Subtitle>{room.name}</Header.Subtitle>
				</Header.Content.Row>
			</Header.Content>
			<Header.ToolBox>
				<Header.ToolBoxAction icon='magnifier'/>
				<Header.ToolBoxAction icon='key'/>
				<Header.ToolBoxAction icon='kebab'/>
			</Header.ToolBox>
		</Header>
	</SettingsContext.Provider>;
};

const toolboxRoom = {
	...room,
	msgs: 2,
	u: { username: 'rocket.cat' },
	usersCount: 2,
};

const renderAction = (
	{ id, icon, title, action, className, tabId },
	index,
) => <Header.ToolBoxAction
	className={className}
	primary={id === tabId}
	data-toolbox={index}
	onClick={action}
	title={title}
	key={id}
	icon={icon}
	color='primary-500'
/>;

addAction('render-action-example', {
	groups: ['channel'],
	id: 'render-action-example',
	title: 'Example',
	icon: 'phone',
	template: lazy(() => import('../../../views/room/MemberListRouter')),
	order: 1,
	renderAction,
});

export const WithToolboxContext = () => {
	const icon = useRoomIcon(room);
	const avatar = <RoomAvatar room={room}/>;
	return <SettingsContext.Provider value={settingContextValue}>
		<Header>
			<Header.Avatar>{avatar}</Header.Avatar>
			<Header.Content>
				<Header.Content.Row>
					{ icon && <Header.Icon icon={icon}/> }
					<Header.Title>{room.name}</Header.Title>
					<Header.State onClick icon='star'/>
					<Header.State icon='key'/>
					<Header.State icon='language'/>
				</Header.Content.Row>
				<Header.Content.Row>
					<Header.Subtitle>{room.name}</Header.Subtitle>
				</Header.Content.Row>
			</Header.Content>
			<Header.ToolBox>
				<ToolboxProvider room={toolboxRoom}>
					<ToolBox />
				</ToolboxProvider>
			</Header.ToolBox>
		</Header>
	</SettingsContext.Provider>;
};