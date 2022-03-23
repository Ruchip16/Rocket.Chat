import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { ILivechatDepartment } from '../../../../../definition/ILivechatDepartment';
import { ILivechatVisitor } from '../../../../../definition/ILivechatVisitor';
import { LivechatRooms, LivechatVisitors, LivechatDepartment } from '../../../../models/server';
import { ILivechatTrigger } from '../../../../../definition/ILivechatTrigger';
import { EmojiCustom, LivechatTrigger } from '../../../../models/server/raw';
import { Livechat } from '../../lib/Livechat';
import { callbacks } from '../../../../../lib/callbacks';
import { normalizeAgent } from '../../lib/Helper';
import { IOmnichannelRoom } from '../../../../../definition/IRoom';

export function online(department: string, skipSettingCheck = false, skipFallbackCheck = false): boolean {
	return Livechat.online(department, skipSettingCheck, skipFallbackCheck);
}

async function findTriggers(): Promise<Pick<ILivechatTrigger, '_id' | 'actions' | 'conditions' | 'runOnce'>[]> {
	const triggers = await LivechatTrigger.findEnabled().toArray();
	return triggers.map(({ _id, actions, conditions, runOnce, name, description, enabled, _updatedAt }) => ({
		_id,
		actions,
		conditions,
		runOnce,
		name,
		description,
		enabled,
		_updatedAt,
	}));
}

export function findDepartments(businessUnit: string): ILivechatDepartment[] {
	return LivechatDepartment.findEnabledWithAgentsAndBusinessUnit(businessUnit, {
		_id: 1,
		name: 1,
		showOnRegistration: 1,
		showOnOfflineForm: 1,
	})
		.fetch()
		.map(({ _id, name, showOnRegistration, showOnOfflineForm }: ILivechatDepartment) => ({
			_id,
			name,
			showOnRegistration,
			showOnOfflineForm,
		}));
}

export function findGuest(token: string): ILivechatVisitor {
	return LivechatVisitors.getVisitorByToken(token, {
		fields: {
			name: 1,
			username: 1,
			token: 1,
			visitorEmails: 1,
			department: 1,
		},
	});
}

export function findRoom(token: string, rid: string): IOmnichannelRoom {
	const fields = {
		t: 1,
		departmentId: 1,
		servedBy: 1,
		open: 1,
		v: 1,
		ts: 1,
	};

	if (!rid) {
		return LivechatRooms.findOneByVisitorToken(token, fields);
	}

	return LivechatRooms.findOneByIdAndVisitorToken(rid, token, fields);
}

export function findOpenRoom(token: string, departmentId?: string): IOmnichannelRoom | null {
	const options = {
		fields: {
			departmentId: 1,
			servedBy: 1,
			open: 1,
			callStatus: 1,
		},
	};

	const rooms = departmentId
		? LivechatRooms.findOpenByVisitorTokenAndDepartmentId(token, departmentId, options).fetch()
		: LivechatRooms.findOpenByVisitorToken(token, options).fetch();
	if (rooms && rooms.length > 0) {
		return rooms[0];
	}

	return null;
}

export function getRoom({
	guest,
	rid,
	roomInfo,
	agent,
	extraParams,
}: {
	guest: ILivechatVisitor;
	rid: string;
	roomInfo: Partial<IOmnichannelRoom>;
	agent?: { agentId?: string; username: string };
	extraParams?: any;
}): Promise<{
	room: any;
	newRoom: boolean;
}> {
	const token = guest?.token;

	const message = {
		_id: Random.id(),
		rid,
		msg: '',
		token,
		ts: new Date(),
	};

	return Livechat.getRoom(guest, message, roomInfo, agent, extraParams);
}

export function findAgent(agentId: string): any {
	return normalizeAgent(agentId);
}

export function normalizeHttpHeaderData(headers = {}): { httpHeaders: { [k: string]: string } } {
	const httpHeaders = Object.assign({}, headers);
	return { httpHeaders };
}

// TODO: an actual type should be put here
export async function settings({ businessUnit = '' } = {}): Promise<Record<string, any>> {
	const initSettings = Livechat.getInitSettings() as unknown as Record<string, string | boolean>;
	const triggers = await findTriggers();
	const departments = findDepartments(businessUnit);
	const sound = `${Meteor.absoluteUrl()}sounds/chime.mp3`;
	const emojis = await EmojiCustom.find().toArray();
	return {
		enabled: initSettings.Livechat_enabled,
		settings: {
			registrationForm: initSettings.Livechat_registration_form,
			allowSwitchingDepartments: initSettings.Livechat_allow_switching_departments,
			nameFieldRegistrationForm: initSettings.Livechat_name_field_registration_form,
			emailFieldRegistrationForm: initSettings.Livechat_email_field_registration_form,
			displayOfflineForm: initSettings.Livechat_display_offline_form,
			videoCall: initSettings.Omnichannel_call_provider === 'Jitsi' && initSettings.Jitsi_Enabled === true,
			fileUpload: initSettings.Livechat_fileupload_enabled && initSettings.FileUpload_Enabled,
			language: initSettings.Language,
			transcript: initSettings.Livechat_enable_transcript,
			historyMonitorType: initSettings.Livechat_history_monitor_type,
			forceAcceptDataProcessingConsent: initSettings.Livechat_force_accept_data_processing_consent,
			showConnecting: initSettings.Livechat_Show_Connecting,
			agentHiddenInfo: initSettings.Livechat_show_agent_info === false,
			clearLocalStorageWhenChatEnded: initSettings.Livechat_clear_local_storage_when_chat_ended,
			limitTextLength:
				initSettings.Livechat_enable_message_character_limit &&
				(initSettings.Livechat_message_character_limit || initSettings.Message_MaxAllowedSize),
		},
		theme: {
			title: initSettings.Livechat_title,
			color: initSettings.Livechat_title_color,
			offlineTitle: initSettings.Livechat_offline_title,
			offlineColor: initSettings.Livechat_offline_title_color,
			actionLinks: {
				webrtc: [
					{
						actionLinksAlignment: 'flex-start',
						i18nLabel: 'Join_call',
						label: TAPi18n.__('Join_call'),
						// eslint-disable-next-line @typescript-eslint/camelcase
						method_id: 'joinLivechatWebRTCCall',
					},
					{
						i18nLabel: 'End_call',
						label: TAPi18n.__('End_call'),
						// eslint-disable-next-line @typescript-eslint/camelcase
						method_id: 'endLivechatWebRTCCall',
						danger: true,
					},
				],
				jitsi: [
					// eslint-disable-next-line @typescript-eslint/camelcase
					{ icon: 'icon-videocam', i18nLabel: 'Accept', method_id: 'createLivechatCall' },
					// eslint-disable-next-line @typescript-eslint/camelcase
					{ icon: 'icon-cancel', i18nLabel: 'Decline', method_id: 'denyLivechatCall' },
				],
			},
		},
		messages: {
			offlineMessage: initSettings.Livechat_offline_message,
			offlineSuccessMessage: initSettings.Livechat_offline_success_message,
			offlineUnavailableMessage: initSettings.Livechat_offline_form_unavailable,
			conversationFinishedMessage: initSettings.Livechat_conversation_finished_message,
			conversationFinishedText: initSettings.Livechat_conversation_finished_text,
			transcriptMessage: initSettings.Livechat_transcript_message,
			registrationFormMessage: initSettings.Livechat_registration_form_message,
			dataProcessingConsentText: initSettings.Livechat_data_processing_consent_text,
		},
		survey: {
			items: ['satisfaction', 'agentKnowledge', 'agentResposiveness', 'agentFriendliness'],
			values: ['1', '2', '3', '4', '5'],
		},
		triggers,
		departments,
		resources: {
			sound,
			emojis,
		},
	};
}

export async function getExtraConfigInfo(room: IOmnichannelRoom): Promise<any> {
	return callbacks.run('livechat.onLoadConfigApi', { room });
}

export function onCheckRoomParams<T extends Match.Pattern>(params: T): Promise<T> {
	return callbacks.run('livechat.onCheckRoomApiParams', params);
}