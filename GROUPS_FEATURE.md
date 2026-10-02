# Customer Groups Feature

## Overview
Customer groups allow you to organize customers into reusable lists for easier campaign targeting.

## Database Changes

### New Tables
- `Group` - Stores group information (name, description)
- `GroupMember` - Many-to-many relationship between groups and customers

### Migration

Run the migration on your production server:

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migration
npx prisma migrate dev --name add_groups

# Or for production, apply the SQL directly:
psql -d your_database -f prisma/migrations/groups-migration.sql
```

## New Files Created

### API Endpoints
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create a group
- `GET /api/groups/[id]` - Get group with members
- `PUT /api/groups/[id]` - Update group
- `DELETE /api/groups/[id]` - Delete group
- `POST /api/groups/[id]/members` - Add members to group
- `DELETE /api/groups/[id]/members?customerId=xxx` - Remove member

### Pages
- `/dashboard/groups` - Groups list page
- `/dashboard/groups/[id]` - Group detail page (manage members)

### Updated
- Sidebar navigation now includes "Groups" link
- CampaignForm now supports selecting recipients by group

## Usage

1. **Create Groups**: Navigate to `/dashboard/groups` and click "New Group"
2. **Add Members**: Click "Manage" on a group, then "Add Members"
3. **Select in Campaigns**: When creating a campaign, choose "Select by Group" and pick one or more groups

## Benefits
- No more scrolling through hundreds of customers
- Reusable groups for recurring campaigns
- Customers can belong to multiple groups
- Easy member management
