/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";

export async function setupPurge() {
  try {
    await prisma.userCache.deleteMany();
  } catch {
    // Database not available (e.g. during Electron SPA build)
  }
}
