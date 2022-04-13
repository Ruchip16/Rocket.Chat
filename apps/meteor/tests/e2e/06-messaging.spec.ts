import { expect, test } from '@playwright/test';
import fs from 'fs'

import MainContent from './utils/pageobjects/MainContent';
import SideNav from './utils/pageobjects/SideNav';
import FlexTab from './utils/pageobjects/FlexTab';
import LoginPage from './utils/pageobjects/LoginPage'



// TODO: will be implemented soon
test.describe('[Messaging]', () => {
	let loginPage: LoginPage;
	let mainContent: MainContent;
	let sideNav: SideNav;
	test.beforeAll(async ({ browser, baseURL }) => {
		const context = await browser.newContext();
		const page = await context.newPage();

		loginPage = new LoginPage(page);
		mainContent = new MainContent(page);
		sideNav = new SideNav(page);
		loginPage.goto(baseURL as string)
		await loginPage.login({email: 'rocketchat.internal.admin.test@rocket.chat' , password: 'rocketchat.internal.admin.test' })

	});

	// test.describe('[Normal messaging]', async () => {
	// 	test.describe('[General channel]', async () => {
	// 		test.beforeAll(async () => {
	// 			await sideNav.general().click()
	// 			await mainContent.sendMessage('any_message');
	// 		});
	// 		test('expect message have user name from logged user', async () => {
	// 			await expect(mainContent.lastMessage()).toContainText('rocketchat.internal.admin.test')
	// 		});
	// 	})
	// 	test.describe('[Public channel]', async () => {
	// 		test.beforeAll(async () => {
	// 			await sideNav.general().click()
	// 			await mainContent.sendMessage('any_message');
	// 		})

	// 		test('expect message have user name from logged user', async () => {
	// 			await expect(mainContent.lastMessage()).toContainText('rocketchat.internal.admin.test')
	// 		});
	// 	})
	// 	test.describe('[Private channel]', async () => {
	// 		test.beforeAll(async () => {
	// 			await sideNav.general().click()
	// 			await mainContent.sendMessage('any_message');
	// 		})

	// 		test('expect message have user name from logged user', async () => {
	// 			await expect(mainContent.lastMessage()).toContainText('rocketchat.internal.admin.test')
	// 		});
	// 	})
	// 	test.describe('[Direct message]', async () => {
	// 		test.beforeAll(async () => {
	// 			await sideNav.general().click()
	// 			await mainContent.sendMessage('any_message');
	// 		})

	// 		test('expect message have user name from logged user', async () => {
	// 			await expect(mainContent.lastMessage()).toContainText('rocketchat.internal.admin.test')
	// 		});
	// 	})
	// })

	test.describe('[File Upload]', async () => {
		test.beforeAll(async () => {
			await sideNav.general().click();
		})
		test.describe('[Render]', async () => {
			test.beforeAll(async () => {
				await mainContent.dragAndDropFile()
			})
			test('expect modal is visible', async () => {
				await expect(mainContent.modalTitle()).toHaveText('File Upload')
			})
			test('expect cancel button is visible', async () => {
				await expect(mainContent.modalCancelButton()).toBeVisible()
			})
			test('expect confirm button is visible', async () => {
				await expect(mainContent.buttonSend()).toBeVisible()
			})
			test('expect file preview is visible', async () => {
				await expect (mainContent.modalFilePreview()).toBeVisible()
			})

			test('expect file name input is visible', async () => {
				await expect(mainContent.fileName()).toBeVisible()
				await expect(mainContent.fileName()).toHaveText('File name')
			})

			test('expect file description is visible', async () => {
				await expect(mainContent.fileDescription()).toBeVisible()
				await expect(mainContent.fileDescription()).toHaveText('File description')
			})
		})
		test.describe('[Actions]', async () => {
			test.beforeEach(async () => {
					await mainContent.dragAndDropFile()
			})

			test('expect not show modal after click in cancel button', async () => {
					await mainContent.cancelClick()
					await expect (mainContent.modalFilePreview()).not.toBeVisible()
			})

			test('expect send file not show modal', async () => {
				await mainContent.sendFileClick()
				await expect (mainContent.modalFilePreview()).not.toBeVisible()
			})
			test('expect send file with description', async () => {
				await mainContent.setDescription();
				await mainContent.sendFileClick()
				await expect(mainContent.lastMessage()).toHaveText('any_description')
			})

			test('expect send file with different file name', async () => {
				await mainContent.setFileName();
				await mainContent.sendFileClick();
				await expect(mainContent.lastMessageFileName()).toContainText('any_file1.txt')
			})
		})
	})

	// test.describe('[Messaging actions]', async () => {
	// 	test.describe('[Render]', async () => {

	// 	})
	// })

	// test.describe('[Usage]', async() => {

	// })
});
