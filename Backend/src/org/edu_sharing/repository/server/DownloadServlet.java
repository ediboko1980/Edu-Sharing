package org.edu_sharing.repository.server;

import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.alfresco.model.ContentModel;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.ContentReader;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.StoreRef;
import org.alfresco.service.namespace.QName;
import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.edu_sharing.alfrescocontext.gate.AlfAppContextGate;
import org.edu_sharing.repository.client.rpc.Share;
import org.edu_sharing.repository.client.tools.CCConstants;
import org.edu_sharing.repository.server.tools.ApplicationInfo;
import org.edu_sharing.repository.server.tools.ApplicationInfoList;
import org.edu_sharing.repository.server.tools.URLTool;
import org.edu_sharing.service.nodeservice.NodeService;
import org.edu_sharing.service.nodeservice.NodeServiceFactory;
import org.edu_sharing.service.nodeservice.NodeServiceHelper;
import org.edu_sharing.service.permission.PermissionService;
import org.edu_sharing.service.permission.PermissionServiceFactory;
import org.edu_sharing.service.share.ShareService;
import org.edu_sharing.service.share.ShareServiceImpl;
import org.edu_sharing.service.tracking.TrackingService;
import org.edu_sharing.service.tracking.TrackingServiceFactory;
import org.springframework.context.ApplicationContext;


public class DownloadServlet extends HttpServlet{

	
	static Logger logger = Logger.getLogger(DownloadServlet.class);
	
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {

		String nodeIds = req.getParameter("nodeIds");
		String zipName = req.getParameter("fileName");
		downloadZip(resp, nodeIds.split(","), null, null, null, zipName);

	}

	public static void downloadZip(HttpServletResponse resp, String[] nodeIds, String parentNodeId, String token, String password, String zipName) throws IOException {
		if(zipName==null || zipName.isEmpty())
			zipName="Download.zip";

		if(nodeIds == null || nodeIds.length==0){
			String message = "missing nodeIds";
			resp.sendError(HttpServletResponse.SC_PRECONDITION_FAILED,message);
			return;
		}

		Share share=null;
		ShareService shareService=new ShareServiceImpl();
		if(parentNodeId!=null && token!=null){
			try {
				share = shareService.getShare(parentNodeId, token);
				if (share == null)
					throw new Exception();
				if (share.getPassword()!=null && (!share.getPassword().equals(ShareServiceImpl.encryptPassword(password)))) {
					throw new Exception();
				}
				if (share.getExpiryDate() != ShareService.EXPIRY_DATE_UNLIMITED) {
					if (new Date(System.currentTimeMillis()).after(new Date(share.getExpiryDate()))) {
						resp.sendRedirect(URLTool.getNgMessageUrl("share_expired"));
						return;
					}
				}
			}catch(Throwable t){
				t.printStackTrace();
				resp.sendRedirect(URLTool.getNgMessageUrl("invalid_share"));
				return;
			}
			for(String node : nodeIds){
				if(!shareService.isNodeAccessibleViaShare(new NodeRef(StoreRef.STORE_REF_WORKSPACE_SPACESSTORE,parentNodeId),node)){
					resp.sendRedirect(URLTool.getNgMessageUrl("security_error"));
					return;
				}

			}
		}


		/*
		if(appId == null || appId.trim().equals("")){
			String message = "missing appId";
			logger.error(message);
			resp.sendError(HttpServletResponse.SC_PRECONDITION_FAILED,message);
			return;
		}
		*/



		ServletOutputStream op = resp.getOutputStream();

		ApplicationContext appContext = AlfAppContextGate.getApplicationContext();

		ApplicationInfo homeAppInfo = ApplicationInfoList.getHomeRepository();

		NodeService nodeService = NodeServiceFactory.getLocalService();
		PermissionService permissionService = PermissionServiceFactory.getLocalService();

		ByteArrayOutputStream bufferOut = new ByteArrayOutputStream();
		ZipOutputStream zos = new ZipOutputStream(bufferOut);
		zos.setMethod( ZipOutputStream.DEFLATED );

        List<String> errors=new ArrayList<>();
		try{
			AuthenticationUtil.RunAsWork<Boolean> runAll= () ->{
				for(String nodeId : nodeIds){
					try{
						/**
						 * Collection change nodeRef to original
						 */
						boolean isCollectionRef=false;
						if(nodeService.hasAspect(StoreRef.PROTOCOL_WORKSPACE,StoreRef.STORE_REF_WORKSPACE_SPACESSTORE.getIdentifier(),nodeId,CCConstants.CCM_ASPECT_COLLECTION_IO_REFERENCE)){
							String refNodeId = (String)nodeService.getProperty(StoreRef.PROTOCOL_WORKSPACE,StoreRef.STORE_REF_WORKSPACE_SPACESSTORE.getIdentifier(),nodeId, CCConstants.CCM_PROP_IO_ORIGINAL);
							nodeId = refNodeId;

							// check if PERMISSION_READ_ALL (read content) is present
							if(!permissionService.hasPermission(StoreRef.PROTOCOL_WORKSPACE,StoreRef.STORE_REF_WORKSPACE_SPACESSTORE.getIdentifier(),nodeId,CCConstants.PERMISSION_READ_ALL)){
								throw new SecurityException();
							}
							isCollectionRef = true;
						}
						String finalNodeId = nodeId;

                        TrackingServiceFactory.getTrackingService().trackActivityOnNode(new NodeRef(StoreRef.STORE_REF_WORKSPACE_SPACESSTORE,nodeId),null,TrackingService.EventType.DOWNLOAD_MATERIAL);
                        AuthenticationUtil.RunAsWork work= () ->{
                            String filename = nodeService.getProperty(StoreRef.PROTOCOL_WORKSPACE,StoreRef.STORE_REF_WORKSPACE_SPACESSTORE.getIdentifier(),finalNodeId,CCConstants.CM_NAME);
                            String wwwurl = nodeService.getProperty(StoreRef.PROTOCOL_WORKSPACE,StoreRef.STORE_REF_WORKSPACE_SPACESSTORE.getIdentifier(),finalNodeId,CCConstants.CCM_PROP_IO_WWWURL);
                            if(wwwurl!=null){
                                errors.add( filename+": Is a link and can not be downloaded" );
                                return null;
                            }
							InputStream reader = null;
							try {
								reader = nodeService.getContent(StoreRef.PROTOCOL_WORKSPACE,StoreRef.STORE_REF_WORKSPACE_SPACESSTORE.getIdentifier(),finalNodeId, ContentModel.PROP_CONTENT.toString());
							} catch (Throwable t) {
							}
							if(reader==null){
                                errors.add( filename+": Has no content" );
                                return null;
                            }
							if(!NodeServiceHelper.downloadAllowed(finalNodeId)){
								errors.add(filename+": Download not allowed");
								return null;
							}
                            resp.setContentType("application/zip");

                            DataInputStream in = new DataInputStream(reader);

                            ZipEntry entry = new ZipEntry(filename);
                            zos.putNextEntry(entry);
                            byte[] buffer=new byte[1024];
                            while(true){
                                int l=in.read(buffer);
                                if(l<=0)
                                    break;
                                zos.write(buffer,0,l);
                            }
                            in.close();
                            return null;
                        };
                        if(isCollectionRef)
                            AuthenticationUtil.runAsSystem(work);
                        else
                            work.doWork();
					}catch(Throwable t){
                        logger.warn(t.getMessage(),t);
						resp.sendRedirect(URLTool.getNgMessageUrl("INVALID"));
						return false;
					}
				}
				if(errors.size()>0){
					ZipEntry entry = new ZipEntry("Info.txt");
					zos.putNextEntry(entry);
                    zos.write(StringUtils.join(errors,"\r\n").getBytes());
				}
				zos.close();
				return true;
			};
			boolean result;
			if(share!=null){
				result=AuthenticationUtil.runAsSystem(runAll);
			}
			else{
				result=runAll.doWork();
			}
			if(result) {
				resp.setHeader("Content-type","application/octet-stream");
				resp.setHeader("Content-Transfer-Encoding","binary");
				resp.setHeader("Content-Disposition","attachment; filename=\""+cleanName(zipName)+"\"");
				resp.setHeader("Content-Length",""+bufferOut.size());
				resp.getOutputStream().write(bufferOut.toByteArray());
			}
		}
		catch(Throwable t){
			t.printStackTrace();
		}
	}

	public static String cleanName(String name) {
		return name.replaceAll("[^a-zA-Z0-9-_\\.]", "_");
	}

}
