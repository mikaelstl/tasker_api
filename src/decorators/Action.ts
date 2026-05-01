import { Actions } from "src/common/enums/Actions.enum";
import { SetMetadata } from "@nestjs/common";

export const ACTION_KEY = 'action_key';
export const Action = (action: Actions) => SetMetadata(ACTION_KEY, action);