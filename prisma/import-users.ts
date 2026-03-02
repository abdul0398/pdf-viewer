import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import users from '../users.json'

const prisma = new PrismaClient()

async function main() {
  const uploads = await prisma.pdfUpload.findMany({ select: { id: true } })

  let created = 0
  let skipped = 0

  for (const u of users) {
    const mobile = u.mobile.replace(/^65/, '') // strip leading 65
    const password = mobile                    // password = 8-digit number

    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (existing) {
      console.log(`  skip  ${u.email} (already exists)`)
      skipped++
      continue
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { email: u.email, name: u.name, passwordHash, role: 'USER', mobile, color: u.color || null },
    })

    if (uploads.length > 0) {
      await prisma.pdfShare.createMany({
        data: uploads.map((up) => ({ uploadId: up.id, userId: user.id })),
        skipDuplicates: true,
      })
    }

    console.log(`  created ${u.email}  (mobile: ${mobile}, color: ${u.color || 'none'})`)
    created++
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
