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
  .limit locals 20

  bipush 25
  istore 1
  iconst_0
  istore 2
  iconst_1
  istore 3
  iconst_0
  istore 4
  iconst_0
  istore 5
  iconst_0
  istore 6
  iconst_0
  istore 7
  iconst_5
  iconst_3
  iadd
  iconst_2
  imul
  istore 8
  iload 8
  bipush 10
  if_icmpgt GT_TRUE0
  iconst_0
  goto GT_END1
GT_TRUE0:
  iconst_1
GT_END1:
  iconst_1
  iand
  istore 9
  iconst_0
  ifeq NOT_ZERO2
  iconst_0
  goto NOT_END3
NOT_ZERO2:
  iconst_1
NOT_END3:
  istore 10
  bipush 10
  iconst_3
  irem
  istore 11
  iconst_0
  istore 12
  iconst_3
  istore 13
  iload 12
  bipush 10
  if_icmpge ELSE4
  iload 12
  iconst_2
  imul
  istore 14
  getstatic java/lang/System/out Ljava/io/PrintStream;
  iload 14
  invokevirtual java/io/PrintStream/println(I)V
ELSE4:
  iconst_0
  istore 15
  getstatic java/lang/System/out Ljava/io/PrintStream;
  iload 15
  invokevirtual java/io/PrintStream/println(I)V
  getstatic java/lang/System/out Ljava/io/PrintStream;
  iconst_0
  invokevirtual java/io/PrintStream/println(I)V
  iconst_0
  istore 16
  getstatic java/lang/System/out Ljava/io/PrintStream;
  iconst_0
  invokevirtual java/io/PrintStream/println(I)V
  iconst_0
  istore 17
WHILE6:
  iload 17
  iconst_5
  if_icmpge ENDWHILE7
  getstatic java/lang/System/out Ljava/io/PrintStream;
  iload 17
  invokevirtual java/io/PrintStream/println(I)V
  iload 17
  iconst_1
  iadd
  istore 17
  goto WHILE6
ENDWHILE7:
  iconst_0
  istore 18
FOR8:
  iload 18
  iconst_3
  if_icmpge ENDFOR9
  getstatic java/lang/System/out Ljava/io/PrintStream;
  iload 18
  invokevirtual java/io/PrintStream/println(I)V
  iload 18
  iconst_1
  iadd
  istore 18
  goto FOR8
ENDFOR9:
  iload 17
  iconst_5
  if_icmpne ELSE10
  getstatic java/lang/System/out Ljava/io/PrintStream;
  iconst_0
  invokevirtual java/io/PrintStream/println(I)V
  goto ENDIF11
ELSE10:
  getstatic java/lang/System/out Ljava/io/PrintStream;
  iconst_0
  invokevirtual java/io/PrintStream/println(I)V
ENDIF11:
  iconst_0
  istore 19
  getstatic java/lang/System/out Ljava/io/PrintStream;
  iconst_0
  invokevirtual java/io/PrintStream/println(I)V
  getstatic java/lang/System/out Ljava/io/PrintStream;
  iconst_0
  invokevirtual java/io/PrintStream/println(I)V

  return
.end method