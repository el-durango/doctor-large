import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	RoleSelectMenuBuilder,
	type ButtonBuilder,
	type ButtonInteraction
} from "discord.js";
import { giveawayComponents } from "../../../../components/index.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import lastEditBy from "../../../../helpers/lastEdit.js";
import { listify } from "../../../../helpers/listify.js";
import Logger from "../../../../logger/logger.js";
import toDashboard from "../dashboard.js";

export default async function toSetPingRoles(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		return;
	}

	const pingRolesSelect = new RoleSelectMenuBuilder()
		.setCustomId("pingRolesSelect")
		.setMinValues(1)
		.setMaxValues(10);

	const choosePingRoleStr = stripIndents`
			Select the roles you want to ping when publishing the giveaway.
			
			Currently set to: ${
				giveaway.pingRolesIds.size
					? listify(giveaway.pingRolesMentions!, { length: 5 })
					: "No roles"
			}
		`;

	const row1 = new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
		pingRolesSelect
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
		giveawayComponents.dashboard.backButton(),
		giveawayComponents.dashboard.clearPingRolesButton()
	);

	const updateMsg = await interaction.editReply({
		content: choosePingRoleStr,
		components: [row1, row2]
	});

	const component = await updateMsg.awaitMessageComponent({
		filter: (i) => i.user.id === interaction.user.id
	});

	if (component.customId === "back") {
		await component.deferUpdate();

		toDashboard(interaction, id);

		return;
	}

	if (component.customId === "pingRolesSelect") {
		if (!component.isRoleSelectMenu()) {
			return;
		}

		await component.deferUpdate();

		new Logger({ prefix: "GIVEAWAY", interaction }).log(
			`Edited ping roles of giveaway #${giveaway.id}`
		);

		await giveawayManager.edit({
			where: {
				id: giveaway.id
			},
			data: {
				pingRolesIds: component.values,
				...lastEditBy(interaction.user)
			}
		});
	} else if (component.customId === "clearPingRoles") {
		await component.deferUpdate();

		new Logger({ prefix: "GIVEAWAY", interaction }).log(
			`Cleared ping roles of giveaway #${giveaway.id}`
		);

		await giveawayManager.edit({
			where: {
				id: giveaway.id
			},
			data: {
				pingRolesIds: [],
				...lastEditBy(interaction.user)
			}
		});
	}

	await toDashboard(interaction, id);
}
