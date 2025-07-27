import {
  AuthFormProps,
  PROFILE_ONBOARDING_FORM,
  SIGN_IN_FORM,
  SIGN_UP_FORM,
} from "./forms"
import {
  GROUP_PAGE_MENU,
  GroupMenuProps,
  LANDING_PAGE_MENU,
  MenuProps,
} from "./menus"
import {
  CREATE_GROUP_PLACEHOLDER,
  CreateGroupPlaceholderProps,
} from "./placeholder"
import { SKILLS, SkillProps } from "./skills"
import { GROUP_LIST, GroupListProps } from "./slider"

type ZUnveiledConstantsProps = {
  landingPageMenu: MenuProps[]
  signUpForm: AuthFormProps[]
  signInForm: AuthFormProps[]
  profileOnboardingForm: AuthFormProps[]
  groupList: GroupListProps[]
  createGroupPlaceholder: CreateGroupPlaceholderProps[]
  groupPageMenu: GroupMenuProps[]
  skillList: SkillProps[]
}

export const ZUNVEILED_CONSTANTS: ZUnveiledConstantsProps = {
  landingPageMenu: LANDING_PAGE_MENU,
  signUpForm: SIGN_UP_FORM,
  signInForm: SIGN_IN_FORM,
  profileOnboardingForm: PROFILE_ONBOARDING_FORM,
  groupList: GROUP_LIST,
  createGroupPlaceholder: CREATE_GROUP_PLACEHOLDER,
  groupPageMenu: GROUP_PAGE_MENU,
  skillList: SKILLS,
}
