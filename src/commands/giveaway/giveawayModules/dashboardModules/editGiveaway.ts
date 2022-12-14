import { stripIndents } from "common-tags";
import { type ButtonInteraction } from "discord.js";
import { giveawayComponents } from "../../../../components/index.js";
import { EMOJIS } from "../../../../constants.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import lastEditBy from "../../../../helpers/lastEdit.js";
import { ModalCollector } from "../../../../helpers/ModalCollector.js";
import Logger from "../../../../logger/logger.js";
import toDashboard from "../dashboard.js";

export default async function toEditGiveaway(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction.reply({
			components: [],
			ephemeral: true,
			content: stripIndents`
				How did we get here?
			
				${EMOJIS.ERROR} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			embeds: []
		});

		return;
	}

	const editGiveawayModal = giveawayComponents.edit.editOptionsModal(
		giveaway.id,
		giveaway.title,
		giveaway.description,
		giveaway.winnerQuantity
	);

	const success = await interaction
		.showModal(editGiveawayModal)
		.then(() => true)
		.catch(() => false);

	if (!success) {
		await interaction.editReply({
			content: `${EMOJIS.ERROR} Something went wrong trying to edit the giveaway. Try again.`
		});
	}

	const collector = ModalCollector(interaction, editGiveawayModal, {
		time: 180_000
	});

	collector.on("collect", async (modalInteraction) => {
		await modalInteraction.deferUpdate();

		const title = modalInteraction.fields.getTextInputValue("newTitle");

		const rawGiveawayDescription =
			modalInteraction.fields.getTextInputValue("newDescription");

		const description = rawGiveawayDescription
			.split("\n")
			.slice(0, 20)
			.join("\n");

		const winnerQuantity =
			Number(
				modalInteraction.fields.getTextInputValue("newWinnerQuantity")
			) ?? 1;

		new Logger({ prefix: "GIVEAWAY", interaction }).log(
			`Edited giveaway #${id}`
		);

		await giveawayManager.edit({
			where: {
				id
			},
			data: {
				title,
				description,
				winnerQuantity,
				...lastEditBy(interaction.user)
			}
		});

		await toDashboard(modalInteraction, id);
	});
}
