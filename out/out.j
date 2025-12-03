.class public Main
.super java/lang/Object

; construtor padrão
.method public <init>()V
  aload_0
  invokespecial java/lang/Object/<init>()V
  return
.end method

; método main
.method public static main([Ljava/lang/String;)V
  .limit stack 100
  .limit locals 3

  iconst_0
  istore 1
  iconst_1
  istore 2
FOR0:
  iload 2
  bipush 10
  if_icmpgt ENDFOR1
  iload 1
  iload 2
  iadd
  istore 1
  iload 2
  iconst_1
  iadd
  istore 2
  goto FOR0
ENDFOR1:
  getstatic java/lang/System/out Ljava/io/PrintStream;
  iload 1
  invokevirtual java/io/PrintStream/println(I)V

  return
.end method