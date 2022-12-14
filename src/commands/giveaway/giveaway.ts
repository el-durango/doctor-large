import { oneLine } from "common-tags";
import {
	ApplicationCommandOptionType,
	PermissionFlagsBits,
	type RESTPostAPIApplicationCommandsJSONBody
} from "discord.js";
import { EMOJIS } from "../../constants.js";
import Logger from "../../logger/logger.js";
import {
	type Command,
	type CommandModuleInteractions
} from "../../typings/index.js";
import sendToAutocompleteGiveaway from "./giveawayModules/autocompleteGiveaway.js";
import sendToCreate from "./giveawayModules/create.js";
import sendToDashboard from "./giveawayModules/dashboard.js";

const data: RESTPostAPIApplicationCommandsJSONBody = {
	name: "giveaway",
	dm_permission: false,
	description: "Configuration for giveaways.",
	default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
	options: [
		{
			name: "dashboard",
			description: oneLine`
				Shows a dashboard where you can view current giveaways,
				or a specific giveaway to manage it.
			`,
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "giveaway",
					type: ApplicationCommandOptionType.Integer,
					description:
						"Which giveaway should be managed in the dashboard.",
					autocomplete: true,
					required: true
				}
			]
		},
		{
			name: "create",
			description: "Create and customise a new giveaway.",
			type: ApplicationCommandOptionType.Subcommand
		}
	]
};

const run = async (interaction: CommandModuleInteractions) => {
	if (!interaction.isChatInputCommand()) {
		if (interaction.isAutocomplete()) {
			await sendToAutocompleteGiveaway(interaction);
		}

		return;
	}

	switch (interaction.options.getSubcommand()) {
		case "dashboard": {
			await interaction.deferReply({ ephemeral: true });
			const id = interaction.options.getInteger("giveaway", true);

			if (id === -1) {
				interaction.editReply({
					content: `${EMOJIS.SLEEP} Whoa so empty — there are no giveaways`
				});

				break;
			}

			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Opened dashboard of giveaway with ID #${id}`
			);

			sendToDashboard(interaction, id);
			break;
		}

		case "create": {
			await sendToCreate(interaction);
			break;
		}
	}
};

export const getCommand: () => Command = () => ({
	data,
	run
});
