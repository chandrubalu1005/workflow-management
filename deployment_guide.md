# 🚀 Deployment Guide: Enterprise Workflow Management

Follow these steps to deploy your application to production using **Render** (Backend) and **Netlify** (Frontend).

## 1. Prerequisites
- **GitHub Repository**: Your code must be pushed to a GitHub repository.
- **MongoDB Atlas**: Create a free cluster at [mongodb.com](https://www.mongodb.com/).
    - Go to **Network Access** and "Allow Access from Anywhere" (`0.0.0.0/0`) since Render's IPs change.
    - Copy your **Connection String** (e.g., `mongodb+srv://<user>:<password>@cluster.mongodb.net/workflow_db`).

---

## 2. Deploy Backend (Render)
1.  Log in to [Render](https://render.com).
2.  Click **New +** > **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    - **Name**: `workflow-api` (or similar)
    - **Language**: `Node`
    - **Root Directory**: `server`
    - **Build Command**: `npm install`
    - **Start Command**: `node server.js`
5.  Click **Advanced** > **Add Environment Variable**:
    - `MONGODB_URI`: *Your MongoDB Atlas connection string*
    - `JWT_SECRET`: *A long, random string (e.g., asd87a9s8d7hf98shd)*
    - `NODE_ENV`: `production`
    - `CLIENT_URL`: *Your Netlify URL (Wait until step 3 to copy this)*
6.  Click **Create Web Service**.
    - **Note**: Copy the URL Render gives you (e.g., `https://workflow-api.onrender.com`).

---

## 3. Deploy Frontend (Netlify)
1.  Log in to [Netlify](https://netlify.com).
2.  Click **Add new site** > **Import from existing project**.
3.  Connect your GitHub repository.
4.  Configure the build:
    - **Base directory**: `client`
    - **Build command**: `npm run build`
    - **Publish directory**: `dist`
5.  Click **Add Environment Variables**:
    - `VITE_API_URL`: *The Render URL you copied in Step 2* (e.g., `https://workflow-api.onrender.com`)
6.  Click **Deploy site**.
7.  Once deployed, copy your **Netlify URL** (e.g., `https://your-site.netlify.app`).

---

## 4. Final Connection
1.  Go back to your **Render** dashboard.
2.  In your `workflow-api` service, go to **Environment Settings**.
3.  Update the `CLIENT_URL` variable with your **Netlify URL**.
4.  Render will automatically restart the service.

---

### ✅ Deployment Complete!
Your application should now be live.
- Frontend: `https://your-site.netlify.app`
- Backend/API: `https://workflow-api.onrender.com`

---

### Troubleshooting
- **CORS Errors**: Ensure `CLIENT_URL` in Render matches your Netlify URL *exactly* (including `https://` but no trailing slash).
- **Blank Page on Refresh**: This is handled by the `_redirects` file I created in `client/public/`.
- **Database Connection**: Ensure your MongoDB Atlas user has read/write permissions and your password doesn't contain special characters that break URLs (if so, URL-encode them).
