Here’s a complete `README.md` tailored for your GitHub repo, based on your full “Digital Dossier” blog site project:

---

```markdown
# Digital Dossier 📚📝

**Digital Dossier** is a fully responsive and SEO-friendly personal blog and content hub built using **Next.js**, **Tailwind CSS**, **Prisma**, **PostgreSQL**, and **AWS S3**. It supports uploading and viewing **blogs**, **books**, and **product documents**, with cover images, PDF viewing/downloading, and admin-level content management.

## 🚀 Live Demo

*(Insert live site link here once deployed, e.g. `https://digitaldossier.com`)*

## 📸 Preview

*(Insert screenshots or GIFs showcasing blog cards, admin panel, modal forms, and PDF viewer)*

---

## 🛠️ Features

- 🧾 **Document Upload & Metadata Management**  
  Upload PDFs and cover images for Blogs, Books, and Products via an Admin panel.

- 🖼️ **Cover Image & PDF Viewer**  
  Public-facing pages show visually styled cards with on-click full-screen PDF viewing and download support.

- 🔍 **Search, Filter, and Slugs**  
  Dynamic search for all artifact types. Individual slugs show detailed views (`/blogs/[slug]`, etc.).

- 🧰 **Admin Dashboard**
  - Upload new content (blogs, books, products)
  - Edit metadata and replace image/PDF (via modal)
  - Delete content with S3 + Postgres cleanup
  - Dashboard overview with counts of each type
  - Confirmation dialog on delete

- 🎨 **Canva Integration** *(Planned)*  
  Create cover designs and documents from templates, then save into the platform.

- 📈 **Google Analytics Integration** *(Planned)*  
  Track visits, engagement, and popular content.

- 📣 **Community & Social Sharing** *(Planned)*  
  Email signups, LinkedIn/X sharing buttons.

- ☁️ **Storage on AWS S3**  
  Content is uploaded to and served from S3. Public URLs are composed dynamically.

- 🖥️ **Responsive UI + SEO-friendly**  
  Built for all devices with accessibility and performance in mind.

---

## 🧩 Tech Stack

| Layer        | Tech                                 |
|--------------|--------------------------------------|
| Frontend     | Next.js, React, Tailwind CSS         |
| Backend      | Node.js, API routes, Prisma ORM      |
| Database     | PostgreSQL                           |
| File Storage | AWS S3 (replaced MinIO in prod)      |
| Viewer       | Custom full-screen PDF modal         |
| Deployment   | Docker Compose                       |

---

## 📁 Project Structure

```

.
├── components/         # Reusable UI components (Cards, Modals, Sidebar, etc.)
├── lib/                # Prisma client setup
├── pages/              # Next.js pages (blogs, books, products, admin, etc.)
├── public/             # Static assets
├── styles/             # Tailwind globals
├── docker-compose.yml  # Containerized app setup
├── .env                # Env vars for Postgres and S3
└── prisma/
└── schema.prisma   # Prisma data models

````

---

## 🧪 Local Development

### 🧰 Prerequisites

- Node.js 18+
- Docker + Docker Compose
- AWS S3 bucket + IAM user with credentials
- PostgreSQL database

### 🏁 Setup

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/digital-dossier.git
cd digital-dossier

# 2. Create your .env file from the example
cp .env.example .env
# Set your AWS, DB, and app config values

# 3. Start with Docker Compose
docker-compose up --build

# App runs at http://localhost:3003
````

### 🔄 Prisma Commands

```bash
# Generate Prisma client
npx prisma generate

# Apply schema to DB
npx prisma migrate dev --name init
```

---

## 🔒 Environment Variables

The `.env` file contains keys like:

```env
DATABASE_URL=postgresql://user:pass@host:port/db
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=yyy
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

---

## 🐛 Common Issues

* **Prisma KnownRequestError**: Usually means missing DB fields or schema drift — check `prisma.schema` and rerun migrations.
* **Missing uploads in S3**: Make sure `coverKey` and `pdfKey` are saved correctly in metadata.

---

## 📌 Planned Enhancements

* ✏️ Local Writing Mode for Blogs (in addition to uploads)
* 🎨 Full Canva-based template creation workflow
* 🔔 Real-time notifications for new uploads
* 📬 Email newsletter and community features
* 📊 Google Analytics & dashboard widgets

---

## 📖 Blog Post

> Learn more about the making of Digital Dossier in the full story:
> ["How Vibe Coding with Generative AI Accelerated My Blog Development"](https://digitaldossier.com/blog/vibe-coding-ai)

---

## 📂 License

MIT License. See [LICENSE](LICENSE) file.

---

## 🙌 Credits

* [Next.js](https://nextjs.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Prisma](https://www.prisma.io/)
* [AWS S3](https://aws.amazon.com/s3/)
* Lucide Icons, Canva SDK (planned)

---

## 💡 Contributing

Got a cool idea or found a bug?
Feel free to open issues or pull requests — contributions are welcome!

---

## 🔗 Contact

Built with ❤️ by [Suvojit Dutta](https://www.linkedin.com/in/suvojit-dutta/)


