# Google AdSense Integration Setup Guide

## Overview
Google AdSense has been successfully integrated into your Smart Process Flow application with complete admin control. Ads can be displayed on the Dashboard and Blog pages, with 6 strategic placement locations.

## Database Migration

**IMPORTANT:** Before using the ads feature, you must run the database migration:

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/migration_ads_settings.sql
```

Or if using a connection string:
```bash
psql $DATABASE_URL -f database/migration_ads_settings.sql
```

This will create the `ads_settings` table with your Google AdSense credentials pre-configured:
- Client ID: `ca-pub-4617878161064725`
- Ad Slot ID: `9346531698`

## Ad Placement Locations

### Dashboard Page (2 placements)
1. **After Stats Cards** - Appears below the 4 statistics cards
2. **After Start Automation Button** - Appears below the green "Start Automation" button

### Blog Page (4 placements)
3. **Blog Listing Top** - Appears at the top of the blog listing page, after the search/filter section
4. **Blog Listing Bottom** - Appears at the bottom of the blog listing page, after all posts
5. **Blog Single Top** - Appears at the top of individual blog posts, after the "Back to Blog" link
6. **Blog Single Bottom** - Appears at the bottom of individual blog posts, after the article content

## Admin Control Panel

### Accessing the Ads Manager
1. Log in as an admin user
2. Navigate to the Admin Dashboard
3. Click on the **"Ads"** tab

### Managing Ad Placements
The Ads Management interface allows you to:
- **View all ad placements** organized by page (Dashboard/Blog)
- **Enable/Disable individual placements** using toggle buttons
- **See current AdSense configuration** (Client ID and Slot ID)
- **View detailed descriptions** of each placement location

### Enabling Ads
By default, all ad placements are **disabled**. To enable ads:

1. Go to Admin Dashboard → Ads tab
2. Click the **"Enable"** button next to any placement
3. The ad will immediately become active on the respective page
4. Users will see the ad when they visit that page

### Disabling Ads
To disable ads:
1. Go to Admin Dashboard → Ads tab
2. Click the **"Disable"** button next to the active placement
3. The ad will be hidden immediately

## Features

✅ **Dynamic Ad Loading** - Ads fetch their configuration from the database
✅ **Real-time Control** - Enable/disable ads without code changes
✅ **Admin-Only Access** - Only admin users can modify ad settings
✅ **Responsive Design** - Ads adapt to all screen sizes
✅ **No Page Reload Required** - Changes take effect immediately
✅ **Performance Optimized** - Ads load asynchronously without blocking page content

## Technical Details

### Files Created/Modified
- `database/migration_ads_settings.sql` - Database migration file
- `src/components/AdSenseAd.tsx` - Updated ad component with dynamic settings
- `src/components/AdsManagementTab.tsx` - New admin interface for managing ads
- `src/pages/AdminDashboard.tsx` - Added Ads tab
- `src/pages/NewDashboard.tsx` - Integrated 2 ad placements
- `src/pages/BlogPage.tsx` - Integrated 4 ad placements
- `server/index.cjs` - Added 4 new API endpoints
- `server/database.cjs` - Added database methods for ads management

### API Endpoints
- `GET /api/ads/settings` - Fetch all ad configurations
- `GET /api/ads/settings/:location` - Fetch specific placement configuration
- `PUT /api/ads/settings/:id` - Update ad placement settings (admin only)
- `PATCH /api/ads/toggle/:id` - Toggle ad placement on/off (admin only)

### Database Table Structure
```sql
ads_settings (
  id                    uuid PRIMARY KEY
  ad_client_id          text (Google AdSense Client ID)
  ad_slot_id            text (Google AdSense Slot ID)
  ad_format             text (Ad format, default: 'auto')
  full_width_responsive boolean (Responsive setting)
  enabled               boolean (Whether placement is active)
  placement_location    text UNIQUE (Identifier for placement)
  page_name             text (Dashboard or Blog)
  description           text (Human-readable description)
  created_at            timestamptz
  updated_at            timestamptz
)
```

## Testing

After running the migration:

1. **Verify Database** - Check that the `ads_settings` table exists with 6 rows
2. **Access Admin Panel** - Log in as admin and navigate to Ads tab
3. **Enable Test Ad** - Enable "Dashboard After Stats" placement
4. **View Dashboard** - Navigate to user dashboard and verify ad appears
5. **Disable Ad** - Return to admin panel and disable the placement
6. **Verify Hidden** - Check that ad no longer appears on dashboard

## Troubleshooting

### Ads Not Appearing
- Ensure the database migration has been run
- Check that the placement is **enabled** in the admin panel
- Verify Google AdSense script is loading (check browser console)
- Confirm ad_client_id matches your Google AdSense account

### Admin Panel Issues
- Ensure you're logged in as an admin user (`is_admin = true`)
- Check browser console for API errors
- Verify database connection is working

### Database Connection
- Confirm `.env` file has correct database credentials
- Test database connection: `psql -h $DB_HOST -U $DB_USER -d $DB_NAME`

## Support

For issues or questions about the AdSense integration:
1. Check the browser console for error messages
2. Review server logs for API errors
3. Verify database table structure matches the migration
4. Ensure Google AdSense account is active and approved

---

**Note:** Google AdSense may take 24-48 hours to start showing live ads after initial setup. During this period, you may see blank spaces where ads will eventually appear.
