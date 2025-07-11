# Membership Management System

A comprehensive, full-stack membership management system built with Next.js, TypeScript, and PostgreSQL. This application provides role-based access control for superadmins, organization admins, and members with features like application processing, document management, and secure authentication.

## 🚀 Features

### For Members
- **Secure Authentication**: OTP-based login via email/phone or membership ID
- **Digital Membership Cards**: Downloadable PDF certificates and digital ID cards
- **KYC Verification**: Document upload and verification system
- **Member Directory**: Connect with other professionals in your organization
- **Real-time Chat**: Communication with fellow members
- **Profile Management**: Complete profile with professional details

### For Organization Admins
- **Application Management**: Review and approve membership applications
- **Member Management**: Manage organization members and their status
- **Document Verification**: Review and approve uploaded documents
- **Dashboard Analytics**: Overview of organization statistics
- **Communication Tools**: Messaging and notifications

### For Superadmins
- **Organization Management**: Create and manage multiple organizations
- **Admin Approval**: Review and approve organization admin registrations
- **System Oversight**: Monitor all organizations and their activities
- **User Management**: Comprehensive user and role management

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Vercel Postgres
- **Authentication**: Custom JWT-based authentication with OTP verification
- **Email**: Nodemailer with SMTP/Resend/SendGrid support
- **SMS**: Twilio integration for phone verification
- **File Storage**: Local storage with AWS S3 ready integration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18.0 or higher
- npm or yarn package manager
- PostgreSQL database (local or cloud)
- Git

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/membership-management-system.git
cd membership-management-system
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

1. Copy the environment example file:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your configuration:

```bash
# Database Configuration (Required)
POSTGRES_URL="postgresql://username:password@localhost:5432/membership_db"

# JWT Secret (Required - Generate a strong secret)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"

# Email Configuration (Choose one)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Or use Resend (Recommended)
RESEND_API_KEY="re_your_resend_api_key_here"

# SMS Configuration (Optional)
TWILIO_ACCOUNT_SID="AC_your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"
```

### 4. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE membership_db;
```

2. Run the database schema script:
```bash
psql -U username -d membership_db -f database-schema.sql
```

Or manually execute the SQL schema provided in the database-schema.sql file.

### 5. Run the Application

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## 🗄 Database Schema

The application uses the following main tables:

- **organizations**: Professional organizations/associations
- **users**: Unified user table for all user types
- **admin_users**: Organization administrators
- **membership_applications**: Member applications with approval workflow
- **otp_verifications**: OTP codes for authentication

See `database-schema.sql` for the complete schema with sample data.

## 🔐 Default Login Credentials

### Superadmin Access
- **URL**: `http://localhost:3000/superadmin/login`
- **Email**: `superadmin@demo.com`
- **Password**: `SuperAdmin@123`

### Demo Admin Access
- **URL**: `http://localhost:3000/admin/login`
- **Username**: `johnadmin`
- **Password**: `Admin@123`

### Member Access
- **URL**: `http://localhost:3000`
- **Method**: Use OTP verification with sample member emails or membership IDs

## 🔄 Application Workflow

### 1. Member Registration
1. User applies for membership at `/register`
2. Selects organization and provides details
3. Chooses proposer and seconder from existing members
4. Uploads required documents
5. Application sent for admin review

### 2. Admin Approval Process
1. Admin receives application notification
2. Reviews member details and documents
3. Approves or rejects application
4. System generates membership ID and sends confirmation

### 3. Member Activation
1. Approved member receives email notification
2. Can login using email/phone OTP or membership ID
3. Access to member dashboard and features
4. Can download digital membership card

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── admin/                   # Admin-specific pages
│   ├── member/                  # Member-specific pages
│   ├── superadmin/             # Superadmin pages
│   ├── api/                    # API routes
│   └── page.tsx                # Homepage
├── components/
│   └── ui/                     # Reusable UI components
├── lib/                        # Utility functions
│   ├── auth.ts                 # Authentication utilities
│   ├── database.ts             # Database utilities
│   ├── otp.ts                  # OTP handling
│   └── utils.ts                # General utilities
├── hooks/                      # Custom React hooks
└── middleware.ts               # Route protection middleware
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production
```bash
POSTGRES_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
NEXTAUTH_URL="https://yourdomain.com"
RESEND_API_KEY="your-production-resend-key"
```

### Other Platforms

The application can be deployed to any platform that supports Node.js:
- Railway
- Render
- DigitalOcean App Platform
- AWS Amplify
- Google Cloud Platform

## 📧 Email Configuration

### Using Gmail SMTP
1. Enable 2-factor authentication on your Gmail account
2. Generate an app password
3. Use the app password in `SMTP_PASS`

### Using Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Set `RESEND_API_KEY` in environment variables

### Using SendGrid
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Set `SENDGRID_API_KEY` in environment variables

## 📱 SMS Configuration (Optional)

### Using Twilio
1. Sign up at [twilio.com](https://twilio.com)
2. Get your Account SID, Auth Token, and phone number
3. Configure in environment variables

## 🔧 Customization

### Adding New Organizations
1. Login as superadmin
2. Navigate to Organizations tab
3. Click "Add Organization"
4. Fill in organization details

### Customizing Email Templates
Edit the email templates in `lib/otp.ts`:
```typescript
function createEmailContent(otp: string) {
  const html = `
    <!-- Your custom HTML email template -->
  `
  // ...
}
```

### Adding New User Roles
1. Update the role hierarchy in `middleware.ts`
2. Add role-specific routes and permissions
3. Update the database schema if needed

## 🐛 Troubleshooting

### Database Connection Issues
- Verify your PostgreSQL connection string
- Ensure the database exists and is accessible
- Check firewall settings for cloud databases

### Email Not Sending
- Verify SMTP credentials
- Check spam folders
- Ensure less secure app access is enabled (for Gmail)

### SMS Not Working
- Verify Twilio credentials
- Check phone number format (+1234567890)
- Ensure sufficient Twilio credits

### Authentication Issues
- Verify JWT_SECRET is set and consistent
- Check token expiration settings
- Clear browser cookies and try again

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@yourcompany.com
- Documentation: [Your documentation link]

## 🔮 Roadmap

- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with payment gateways
- [ ] Multi-language support
- [ ] Advanced document verification with AI
- [ ] Video conferencing integration
- [ ] Event management system

---

**Built with ❤️ using Next.js, TypeScript, and PostgreSQL**