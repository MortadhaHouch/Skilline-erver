import path from "path"

export default function getContentType(file:string){
    switch (path.extname(file).split(".")[1]) {
        case "html": 
        case "htm": 
        case "shtml":
            return "text/html"                                        
        case "css":
            return "text/css"                                         
        case "xml":
            return "text/xml"                                         
        case "gif":
            return "image/gif"                                        
        case "jpeg": 
        case "jpg":
            return "image/jpeg"                                       
        case "js":
            return "application/javascript"                           
        case "atom":
            return "application/atom+xml"                             
        case "rss":
            return "application/rss+xml"                              
        case "mml":
            return "text/mathml"                                      
        case "txt":
            return "text/plain"                                       
        case "jad":
            return "text/vnd.sun.j2me.app-descriptor"                 
        case "wml":
            return "text/vnd.wap.wml"                                 
        case "htc":
            return "text/x-component "                                
        case "avif":
            return "image/avif"                                      
        case "png":
            return "image/png"                                        
        case "svg":
        case "svgz":
            return "image/svg+xml"                                    
        case "tif":
        case "tiff":
            return "image/tiff"                                       
        case "wbmp":
            return "image/vnd.wap.wbmp"                               
        case "webp":
            return "image/webp"                                       
        case "ico":
            return "image/x-icon"                                     
        case "jng":
            return "image/x-jng"                                      
        case "bmp":
            return "image/x-ms-bmp"                                   
        case "woff":
            return "font/woff"                                        
        case "woff2":
            return "font/woff2"                                       
        case "jar":
        case "war":
        case "ear":
            return "application/java-archive"                         
        case "json":
            return "application/json"                                 
        case "hqx":
            return "application/mac-binhex40"                         
        case "doc":
            return "application/msword"                               
        case "pdf":
            return "application/pdf"                                  
        case "ps": 
        case "eps":
        case "ai":
            return "application/postscript"                           
        case "rtf":
            return "application/rtf"                                  
        case "m3u8":
            return "application/vnd.apple.mpegurl"                    
        case "kml":
            return "application/vnd.google-earth.kml+xml"             
        case "kmz":
            return "application/vnd.google-earth.kmz"                 
        case "xls":
            return "application/vnd.ms-excel"                         
        case "eot":
            return "application/vnd.ms-fontobject"                    
        case "ppt":
            return "application/vnd.ms-powerpoint"                    
        case "odg":
            return "application/vnd.oasis.opendocument.graphics"      
        case "odp":
            return "application/vnd.oasis.opendocument.presentation"  
        case "ods":
            return "application/vnd.oasis.opendocument.spreadsheet"   
        case "odt":
            return "application/vnd.oasis.opendocument.text"          
        case "pptx":
            return "application/vnd.openxmlformats-officedocument.presentationml.presentation" 
        case "xlsx":
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"  
        case "docx":
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
        case "wmlc":
            return "application/vnd.wap.wmlc"                         
        case "wasm":
            return "application/wasm"                                 
        case "7z":
            return "application/x-7z-compressed"                      
        case "cco":
            return "application/x-cocoa"                              
        case "jardiff":
            return "application/x-java-archive-diff"                  
        case "jnlp":
            return "application/x-java-jnlp-file"                     
        case "run":
            return "application/x-makeself"                           
        case "pl":
        case "pm":
            return "application/x-perl"                               
        case "prc":
        case "pdb":
            return "application/x-pilot"                              
        case "rar":
            return "application/x-rar-compressed"                     
        case "rpm":
            return "application/x-redhat-package-manager"             
        case "sea":
            return "application/x-sea"                                
        case "swf":
            return "application/x-shockwave-flash"                    
        case "sit":
            return "application/x-stuffit"                            
        case "tcl": 
        case "tk":
            return "application/x-tcl"                                
        case "der":
        case "pem":
        case "crt":
            return "application/x-x509-ca-cert"                       
        case "xpi":
            return "application/x-xpinstall"                          
        case "xhtml":
            return "application/xhtml+xml"                            
            case "xspf":
            return "application/xspf+xml"                             
        case "zip":
            return "application/zip"                                  
        case "bin": 
        case "exe":
        case "dll":
        case "deb":
        case "dmg":
        case "msi":
        case "msp":
        case "msm":
        case "iso": 
        case "img":
            return "application/octet-stream"                         
        case "mid":
        case "midi": 
        case "kar":
            return "audio/midi"                                       
        case "mp3":
            return "audio/mpeg"                                       
        case "ogg":
            return "audio/ogg"                                        
        case "m4a":
            return "audio/x-m4a"                                      
        case "ra":
            return "audio/x-realaudio"                                
        case "3gpp":
        case "3gp":
            return "video/3gpp"                                       
        case "ts":
            return "video/mp2t"                                       
        case "mp4":
            return "video/mp4"                                        
        case "mpeg":
        case "mpg":
            return "video/mpeg"                                       
        case "mov":
            return "video/quicktime"                                  
        case "webm":
            return "video/webm"                                       
        case "flv":
            return "video/x-flv"                                      
        case "m4v":
            return "video/x-m4v"                                      
        case "mng":
            return "video/x-mng"                                      
        case "asx":
        case "asf":
            return "video/x-ms-asf"                                   
        case "wmv":
            return "video/x-ms-wmv"                                   
        case "avi":
            return "video/x-msvideo"                                  
    }
}
module.exports = getContentType